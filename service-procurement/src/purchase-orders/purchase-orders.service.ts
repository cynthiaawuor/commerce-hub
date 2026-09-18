import type { CurrentUser } from "../core/current-user";
import { isUniqueViolation } from "../core/db-errors";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../core/http-error";
import {
  canApprove,
  isSelfApproval,
  requiredRoleFor,
} from "./approval-authority";
import { canTransition } from "./purchase-order-state";
import type { PurchaseOrderStatus } from "./purchase-order-status";
import { CancelPurchaseOrderDto } from "./dtos/cancel-purchase-order.dto";
import { RejectPurchaseOrderDto } from "./dtos/reject-purchase-order.dto";
import { toCents } from "../core/money";
import parseAndValidate from "../core/validation";
import * as vendorClient from "../vendor/vendor.client";
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
// The supplier's name and payment terms are copied from Vendor Management and frozen here:
// the business commits to the terms that applied on the day it ordered.
const createPurchaseOrder = async (body: unknown, createdBy: string) => {
  const { obj, errors } = await parseAndValidate(CreatePurchaseOrderDto, body);

  if (errors) {
    throw new BadRequestError("Unprocessable purchase order details", errors);
  }

  const supplier = await vendorClient.getSupplier(obj!.supplierId);

  if (!supplier) {
    throw new BadRequestError(
      `Supplier ${obj!.supplierId} does not exist in Vendor Management`,
    );
  }

  if (supplier.status !== "ACTIVE") {
    throw new ConflictError(
      `Supplier ${supplier.name} is ${supplier.status} and cannot receive new orders`,
    );
  }

  // The PO number is derived from how many orders exist. Two buyers creating an order at
  // the same moment can land on the same number, so retry when the unique index rejects it.
  for (let attempt = 0; attempt < PO_NUMBER_ATTEMPTS; attempt += 1) {
    const sequence = (await purchaseOrderRepository.count()) + 1 + attempt;

    try {
      return await purchaseOrderRepository.insertDraft({
        supplierId: supplier.id,
        supplierName: supplier.name,
        paymentTerms: supplier.paymentTerms,
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

// The buyer says which product and how many; everything else is read from the supplier's
// catalog in Vendor Management and locked onto the line at this moment.
const addPurchaseOrderLine = async (purchaseOrderId: string, body: unknown) => {
  const { obj, errors } = await parseAndValidate(AddPurchaseOrderLineDto, body);

  if (errors) {
    throw new BadRequestError("Unprocessable purchase order line", errors);
  }

  const purchaseOrder = await assertDraft(purchaseOrderId);

  const offers = await vendorClient.getProductSuppliers(obj!.productId);
  const offer = offers.find(
    (candidate) => candidate.supplierId === purchaseOrder.supplierId,
  );

  if (!offer) {
    throw new BadRequestError(
      `Supplier ${purchaseOrder.supplierId} is not approved to supply product ${obj!.productId}`,
    );
  }

  try {
    return await purchaseOrderRepository.insertLine(purchaseOrderId, {
      productId: offer.productId,
      catalogItemId: offer.catalogItemId,
      productName: offer.productName,
      quantityOrdered: obj!.quantityOrdered,
      unitCostCents: toCents(offer.unitPrice),
      leadTimeDays: offer.leadTimeDays,
    });
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

// Only the quantity changes here. The unit cost stays as it was locked when the line
// was added, which is the price the business committed to.
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

  await assertDraft(purchaseOrderId);

  if (!(await purchaseOrderRepository.findLine(purchaseOrderId, lineId))) {
    throw new NotFoundError(
      `Line ${lineId} is not on purchase order ${purchaseOrderId}`,
    );
  }

  return purchaseOrderRepository.updateLine(purchaseOrderId, lineId, {
    quantityOrdered: obj!.quantityOrdered,
  });
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

// Loads the order and checks the move is one the lifecycle allows, so every action
// below shares the same 404 and 409 behaviour.
const assertCanTransition = async (id: string, to: PurchaseOrderStatus) => {
  const purchaseOrder = await purchaseOrderRepository.findSummaryById(id);

  if (!purchaseOrder) {
    throw new NotFoundError(`Purchase order with ID ${id} not found`);
  }

  if (!canTransition(purchaseOrder.status, to)) {
    throw new ConflictError(
      `Purchase order ${purchaseOrder.poNumber} is ${purchaseOrder.status} and cannot move to ${to}`,
    );
  }

  return purchaseOrder;
};

// Hands the order to an approver. An order with no lines has nothing to approve, and its
// total of zero would slip under any approval limit, so it is refused here.
const submitPurchaseOrder = async (id: string, user: CurrentUser) => {
  const purchaseOrder = await assertCanTransition(id, "PENDING_APPROVAL");

  if ((await purchaseOrderRepository.countLines(id)) === 0) {
    throw new ConflictError(
      `Purchase order ${purchaseOrder.poNumber} has no lines and cannot be submitted`,
    );
  }

  return purchaseOrderRepository.changeStatus(id, {
    fromStatus: purchaseOrder.status,
    toStatus: "PENDING_APPROVAL",
    changedBy: user.id,
    reason: null,
  });
};

// The commitment point: after this the business owes the supplier for these goods,
// so the approver must hold enough authority for the amount.
const approvePurchaseOrder = async (id: string, user: CurrentUser) => {
  const purchaseOrder = await assertCanTransition(id, "APPROVED");

  if (isSelfApproval(purchaseOrder.createdBy, user.id)) {
    throw new ForbiddenError(
      `Purchase order ${purchaseOrder.poNumber} must be approved by someone other than the buyer who raised it`,
    );
  }

  if (!canApprove(user.role, purchaseOrder.totalCents)) {
    throw new ForbiddenError(
      `Purchase order ${purchaseOrder.poNumber} needs ${requiredRoleFor(purchaseOrder.totalCents)} approval; role ${user.role} is not enough`,
    );
  }

  return purchaseOrderRepository.changeStatus(id, {
    fromStatus: purchaseOrder.status,
    toStatus: "APPROVED",
    changedBy: user.id,
    reason: null,
    approval: { approvedBy: user.id, approvedAt: new Date().toISOString() },
  });
};

// Sends the order back to the buyer, who edits it and submits again
const rejectPurchaseOrder = async (
  id: string,
  body: unknown,
  user: CurrentUser,
) => {
  const { obj, errors } = await parseAndValidate(RejectPurchaseOrderDto, body);

  if (errors) {
    throw new BadRequestError("A rejection reason is required", errors);
  }

  const purchaseOrder = await assertCanTransition(id, "REJECTED");

  return purchaseOrderRepository.changeStatus(id, {
    fromStatus: purchaseOrder.status,
    toStatus: "REJECTED",
    changedBy: user.id,
    reason: obj!.reason,
  });
};

const cancelPurchaseOrder = async (
  id: string,
  body: unknown,
  user: CurrentUser,
) => {
  const { obj, errors } = await parseAndValidate(CancelPurchaseOrderDto, body);

  if (errors) {
    throw new BadRequestError("Unprocessable cancellation", errors);
  }

  const purchaseOrder = await assertCanTransition(id, "CANCELLED");

  return purchaseOrderRepository.changeStatus(id, {
    fromStatus: purchaseOrder.status,
    toStatus: "CANCELLED",
    changedBy: user.id,
    reason: obj!.reason ?? null,
  });
};

const getPurchaseOrderHistory = async (id: string) => {
  if (!(await purchaseOrderRepository.findSummaryById(id))) {
    throw new NotFoundError(`Purchase order with ID ${id} not found`);
  }

  return purchaseOrderRepository.findStatusHistory(id);
};

export {
  addPurchaseOrderLine,
  approvePurchaseOrder,
  cancelPurchaseOrder,
  createPurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrder,
  getPurchaseOrderHistory,
  listPurchaseOrders,
  rejectPurchaseOrder,
  removePurchaseOrderLine,
  submitPurchaseOrder,
  updatePurchaseOrderLine,
};
