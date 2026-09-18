import { db } from "../prisma/db";
import type { PurchaseOrderStatus } from "./purchase-order-status";

const PurchaseOrder = db.orm.public.PurchaseOrder;
const PurchaseOrderLine = db.orm.public.PurchaseOrderLine;

// The context db.transaction() hands to its callback
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type NewPurchaseOrder = {
  poNumber: string;
  supplierId: string;
  supplierName: string;
  paymentTerms: string;
  createdBy: string;
  notes: string | null;
};

type NewPurchaseOrderLine = {
  productId: string;
  catalogItemId: string;
  productName: string;
  quantityOrdered: number;
  unitCostCents: number;
  leadTimeDays: number;
};

type PurchaseOrderLineChanges = Partial<
  Pick<
    NewPurchaseOrderLine,
    "quantityOrdered" | "unitCostCents" | "leadTimeDays"
  >
>;

type PurchaseOrderFilters = {
  status?: PurchaseOrderStatus | undefined;
  supplierId?: string | undefined;
};

// Built in one place so a page of orders and the total always apply the same filters
const filtered = ({ status, supplierId }: PurchaseOrderFilters) => {
  // isNotNull() on the primary key matches every row: a starting point to chain onto
  let purchaseOrders = PurchaseOrder.where((po) => po.id.isNotNull());

  if (status) {
    purchaseOrders = purchaseOrders.where({ status });
  }

  if (supplierId) {
    purchaseOrders = purchaseOrders.where({ supplierId });
  }

  return purchaseOrders;
};

// Newest first, with id as a tie-break so a row never lands on two pages
const findPage = async (
  filters: PurchaseOrderFilters,
  offset: number,
  limit: number,
) =>
  filtered(filters)
    .orderBy([(po) => po.createdAt.desc(), (po) => po.id.desc()])
    .offset(offset)
    .limit(limit)
    .all();

const count = async (filters: PurchaseOrderFilters = {}) =>
  (await filtered(filters).aggregate((a) => ({ total: a.count() }))).total;

// Returns null when no order has this id
const findById = async (id: string) =>
  PurchaseOrder.where({ id })
    .include("lines", (line) => line.orderBy((l) => l.productName.asc()))
    .first();

// Just the fields the rules need, without loading the lines
const findSummaryById = async (id: string) =>
  PurchaseOrder.where({ id })
    .select("id", "status", "poNumber", "supplierId", "totalCents", "createdBy")
    .first();

const findLine = async (purchaseOrderId: string, id: string) =>
  PurchaseOrderLine.where({ id, purchaseOrderId }).first();

// totalCents is derived from the lines, so it is recalculated inside the same
// transaction as every line change and never drifts from them.
const recalculateTotal = async (tx: Tx, purchaseOrderId: string) => {
  const lines = await tx.orm.public.PurchaseOrderLine.where({ purchaseOrderId })
    .select("quantityOrdered", "unitCostCents")
    .all();

  const totalCents = lines.reduce(
    (total, line) =>
      total + BigInt(line.quantityOrdered) * BigInt(line.unitCostCents),
    0n,
  );

  await tx.orm.public.PurchaseOrder.where({ id: purchaseOrderId }).update({
    totalCents,
  });
};

// The order and its first history entry are written in one transaction, so an order
// can never exist without an audit trail.
const insertDraft = async (purchaseOrder: NewPurchaseOrder) =>
  db.transaction(async (tx) => {
    const created = await tx.orm.public.PurchaseOrder.create(purchaseOrder);

    await tx.orm.public.PurchaseOrderStatusChange.create({
      purchaseOrderId: created.id,
      toStatus: "DRAFT",
      changedBy: purchaseOrder.createdBy,
    });

    return created;
  });

const insertLine = async (
  purchaseOrderId: string,
  line: NewPurchaseOrderLine,
) =>
  db.transaction(async (tx) => {
    const created = await tx.orm.public.PurchaseOrderLine.create({
      ...line,
      purchaseOrderId,
    });

    await recalculateTotal(tx, purchaseOrderId);

    return created;
  });

const updateLine = async (
  purchaseOrderId: string,
  id: string,
  changes: PurchaseOrderLineChanges,
) =>
  db.transaction(async (tx) => {
    const updated = await tx.orm.public.PurchaseOrderLine.where({
      id,
      purchaseOrderId,
    }).update(changes);

    await recalculateTotal(tx, purchaseOrderId);

    return updated;
  });

const removeLine = async (purchaseOrderId: string, id: string) =>
  db.transaction(async (tx) => {
    await tx.orm.public.PurchaseOrderLine.where({ id, purchaseOrderId }).delete();

    await recalculateTotal(tx, purchaseOrderId);
  });

const countLines = async (purchaseOrderId: string) =>
  (
    await PurchaseOrderLine.where({ purchaseOrderId }).aggregate((a) => ({
      total: a.count(),
    }))
  ).total;

// Oldest first: the audit trail reads as the story of the order
const findStatusHistory = async (purchaseOrderId: string) =>
  db.orm.public.PurchaseOrderStatusChange.where({ purchaseOrderId })
    .orderBy((change) => change.createdAt.asc())
    .all();

type StatusChange = {
  fromStatus: PurchaseOrderStatus;
  toStatus: PurchaseOrderStatus;
  changedBy: string;
  reason: string | null;
  // Only set when approving, so the order records who signed it off and when
  approval?: { approvedBy: string; approvedAt: string } | undefined;
};

// The new status and its history row are written together, so the audit trail can
// never miss a change, and a failed write leaves the status untouched.
const changeStatus = async (id: string, change: StatusChange) =>
  db.transaction(async (tx) => {
    const updated = await tx.orm.public.PurchaseOrder.where({ id }).update({
      status: change.toStatus,
      ...(change.approval ?? {}),
    });

    await tx.orm.public.PurchaseOrderStatusChange.create({
      purchaseOrderId: id,
      fromStatus: change.fromStatus,
      toStatus: change.toStatus,
      changedBy: change.changedBy,
      reason: change.reason,
    });

    return updated;
  });

// Lines and history rows are removed by the database (onDelete: Cascade)
const remove = async (id: string) => {
  await PurchaseOrder.where({ id }).delete();
};

export {
  changeStatus,
  count,
  countLines,
  findById,
  findStatusHistory,
  findLine,
  findPage,
  findSummaryById,
  insertDraft,
  insertLine,
  remove,
  removeLine,
  updateLine,
  type PurchaseOrderFilters,
};
