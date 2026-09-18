import { isUniqueViolation } from "../core/db-errors";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../core/http-error";
import parseAndValidate from "../core/validation";
import { AddPurchaseOrderLineDto } from "./dtos/add-purchase-order-line.dto";
import { CreatePurchaseOrderDto } from "./dtos/create-purchase-order.dto";
import { ListPurchaseOrdersQueryDto } from "./dtos/list-purchase-orders-query.dto";
import { UpdatePurchaseOrderLineDto } from "./dtos/update-purchase-order-line.dto";
import * as purchaseOrderRepository from "./purchase-orders.repository";

const PO_NUMBER_ATTEMPTS = 5;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

const formatPoNumber = (sequence: number) =>
  `PO-${String(sequence).padStart(6, "0")}`;

// Lines and the order itself can only be edited while nobody has approved anything yet.
const assertDraft = async (purchaseOrderId: string) => {
  const purchaseOrder =
    await purchaseOrderRepository.findSummaryById(purchaseOrderId);

  if (!purchaseOrder) {
    throw new NotFoundError(
      `Purchase order with ID ${purchaseOrderId} not found`,
    );
  }

  if (purchaseOrder.status !== "DRAFT") {
    throw new ConflictError(
      `Purchase order ${purchaseOrder.poNumber} is ${purchaseOrder.status} and can no longer be edited`,
    );
  }

  return purchaseOrder;
};

// A new order always starts as a DRAFT with no lines, so its total is 0 until lines are added.
const createPurchaseOrder = async (body: unknown, createdBy: string) => {
  const { obj, errors } = await parseAndValidate(CreatePurchaseOrderDto, body);

  if (errors) {
    throw new BadRequestError("Unprocessable purchase order details", errors);
  }

  // The PO number is derived from how many orders exist. Two buyers creating an order at
  // the same moment can land on the same number, so retry when the unique index rejects it.
  for (let attempt = 0; attempt < PO_NUMBER_ATTEMPTS; attempt += 1) {
    const sequence = (await purchaseOrderRepository.count()) + 1 + attempt;

    try {
      return await purchaseOrderRepository.insertDraft({
        ...obj!,
        notes: obj!.notes ?? null,
        poNumber: formatPoNumber(sequence),
        createdBy,
      });
    } catch (err) {
      if (!isUniqueViolation(err)) {
        throw err;
      }
    }
  }

  throw new ConflictError(
    "Could not allocate a purchase order number. Please try again.",
  );
};

const listPurchaseOrders = async (query: unknown = {}) => {
  const { obj, errors } = await parseAndValidate(
    ListPurchaseOrdersQueryDto,
    query,
  );

  if (errors) {
    throw new BadRequestError("Unprocessable list query", errors);
  }

  const {
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    status,
    supplierId,
  } = obj!;
  const filters = { status, supplierId };

  const [data, total] = await Promise.all([
    purchaseOrderRepository.findPage(filters, (page - 1) * limit, limit),
    purchaseOrderRepository.count(filters),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getPurchaseOrder = async (id: string) => {
  const purchaseOrder = await purchaseOrderRepository.findById(id);

  if (!purchaseOrder) {
    throw new NotFoundError(`Purchase order with ID ${id} not found`);
  }

  return purchaseOrder;
};

const addPurchaseOrderLine = async (purchaseOrderId: string, body: unknown) => {
  const { obj, errors } = await parseAndValidate(
    AddPurchaseOrderLineDto,
    body,
  );

  if (errors) {
    throw new BadRequestError("Unprocessable purchase order line", errors);
  }

  await assertDraft(purchaseOrderId);

  try {
    return await purchaseOrderRepository.insertLine(purchaseOrderId, obj!);
  } catch (err) {
    // (purchaseOrderId, productId) is unique: order more of a product by raising its quantity
    if (isUniqueViolation(err)) {
      throw new ConflictError(
        `Product ${obj!.productId} is already on this purchase order`,
      );
    }
    throw err;
  }
};

const updatePurchaseOrderLine = async (
  purchaseOrderId: string,
  lineId: string,
  body: unknown,
) => {
  const { obj, errors } = await parseAndValidate(
    UpdatePurchaseOrderLineDto,
    body,
  );

  if (errors) {
    throw new BadRequestError("Unprocessable purchase order line", errors);
  }

  // class-validator checks fields one by one, so an empty body has to be caught here
  const changes = Object.fromEntries(
    Object.entries(obj!).filter(([, value]) => value !== undefined),
  );

  if (Object.keys(changes).length === 0) {
    throw new BadRequestError(
      "Provide at least one of quantityOrdered, unitCostCents or leadTimeDays",
    );
  }

  await assertDraft(purchaseOrderId);

  if (!(await purchaseOrderRepository.findLine(purchaseOrderId, lineId))) {
    throw new NotFoundError(
      `Line ${lineId} is not on purchase order ${purchaseOrderId}`,
    );
  }

  return purchaseOrderRepository.updateLine(purchaseOrderId, lineId, changes);
};

const removePurchaseOrderLine = async (
  purchaseOrderId: string,
  lineId: string,
) => {
  await assertDraft(purchaseOrderId);

  if (!(await purchaseOrderRepository.findLine(purchaseOrderId, lineId))) {
    throw new NotFoundError(
      `Line ${lineId} is not on purchase order ${purchaseOrderId}`,
    );
  }

  await purchaseOrderRepository.removeLine(purchaseOrderId, lineId);
};

// Only drafts can be deleted. Once an order has been through approval it is part of the
// record and is cancelled instead (stage 5).
const deletePurchaseOrder = async (id: string) => {
  await assertDraft(id);

  await purchaseOrderRepository.remove(id);
};

export {
  addPurchaseOrderLine,
  createPurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrder,
  listPurchaseOrders,
  removePurchaseOrderLine,
  updatePurchaseOrderLine,
};
