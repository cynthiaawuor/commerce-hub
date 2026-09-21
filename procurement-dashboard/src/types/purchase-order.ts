export type PurchaseOrderStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "SENT"
  | "PARTIALLY_RECEIVED"
  | "CLOSED"
  | "CANCELLED";

export type PurchaseOrderLine = {
  id: string;
  productId: string;
  catalogItemId: string;
  productName: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityOutstanding?: number;
  unitCostCents: number;
  leadTimeDays: number;
};

export type PurchaseOrder = {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  paymentTerms: string;
  status: PurchaseOrderStatus;
  currency: string;
  totalCents: number;
  notes: string | null;
  createdBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lines?: PurchaseOrderLine[];
};

export type StatusChange = {
  id: string;
  fromStatus: PurchaseOrderStatus | null;
  toStatus: PurchaseOrderStatus;
  changedBy: string;
  reason: string | null;
  createdAt: string;
};

export type PageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
