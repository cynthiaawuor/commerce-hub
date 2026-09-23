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

// Orders a delivery can still be booked against. Receiving calls this when a truck
// arrives: "is there an open, approved order for these goods?"
const findOpen = async (supplierId?: string | undefined) => {
  let purchaseOrders = PurchaseOrder.where((po) =>
    po.status.in(["SENT", "PARTIALLY_RECEIVED"]),
  );

  if (supplierId) {
    purchaseOrders = purchaseOrders.where({ supplierId });
  }

  // Oldest first: the earliest order is the one most likely being delivered
  return purchaseOrders
    .include("lines", (line) => line.orderBy((l) => l.productName.asc()))
    .orderBy((po) => po.createdAt.asc())
    .all();
};

type ReceivedQuantity = { lineId: string; quantityReceived: number };

// Received quantities and any resulting status change are written together, so the
// order's status always matches its lines.
const recordReceipt = async (
  id: string,
  received: ReceivedQuantity[],
  statusChange: StatusChange | null,
) =>
  db.transaction(async (tx) => {
    for (const line of received) {
      await tx.orm.public.PurchaseOrderLine.where({
        id: line.lineId,
        purchaseOrderId: id,
      }).update({ quantityReceived: line.quantityReceived });
    }

    if (statusChange) {
      await tx.orm.public.PurchaseOrder.where({ id }).update({
        status: statusChange.toStatus,
      });

      await tx.orm.public.PurchaseOrderStatusChange.create({
        purchaseOrderId: id,
        fromStatus: statusChange.fromStatus,
        toStatus: statusChange.toStatus,
        changedBy: statusChange.changedBy,
        reason: statusChange.reason,
      });
    }

    return tx.orm.public.PurchaseOrder.where({ id })
      .include("lines", (line) => line.orderBy((l) => l.productName.asc()))
      .first();
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

// An event to publish once the change is committed. Written in the same transaction as
// the status change, so the two can never disagree.
type OutboxEventInput = {
  eventType: string;
  aggregateId: string;
  payload: unknown;
};

// The new status, its history row and any outbox event are written together, so the
// audit trail can never miss a change and a failed write leaves the status untouched.
const changeStatus = async (
  id: string,
  change: StatusChange,
  event?: OutboxEventInput | undefined,
) =>
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

    if (event) {
      await tx.orm.public.OutboxEvent.create({
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        payload: JSON.stringify(event.payload),
      });
    }

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
  findOpen,
  findStatusHistory,
  recordReceipt,
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
