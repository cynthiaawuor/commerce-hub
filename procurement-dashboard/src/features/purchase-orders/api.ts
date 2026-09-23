import { apiRequest, type MutationResponse } from "../../lib/api-client";
import type {
  PageMeta,
  PurchaseOrder,
  PurchaseOrderStatus,
  StatusChange,
} from "../../types/purchase-order";
import type { Supplier } from "../../types/supplier";

const base = "/purchase-orders";

export type ListParams = {
  page?: number;
  status?: PurchaseOrderStatus | undefined;
};

export const getPurchaseOrders = ({ page = 1, status }: ListParams) => {
  const query = new URLSearchParams({ page: String(page), limit: "10" });
  if (status) query.set("status", status);

  return apiRequest<{ data: PurchaseOrder[]; meta: PageMeta }>(
    "procurement",
    `${base}?${query.toString()}`,
  );
};

export const getPurchaseOrder = async (id: string) =>
  (await apiRequest<{ data: PurchaseOrder }>("procurement", `${base}/${id}`)).data;

export const getPurchaseOrderHistory = async (id: string) =>
  (await apiRequest<{ data: StatusChange[] }>("procurement", `${base}/${id}/history`)).data;

export const createPurchaseOrder = async (input: {
  supplierId: string;
  notes?: string;
}) =>
  (
    await apiRequest<MutationResponse<PurchaseOrder>>("procurement", base, {
      method: "POST",
      body: input,
    })
  ).data;

export const addLine = async (
  id: string,
  input: { productId: string; quantityOrdered: number },
) =>
  (
    await apiRequest<MutationResponse<unknown>>("procurement", `${base}/${id}/lines`, {
      method: "POST",
      body: input,
    })
  ).data;

export const removeLine = (id: string, lineId: string) =>
  apiRequest<MutationResponse<unknown>>(
    "procurement",
    `${base}/${id}/lines/${lineId}`,
    { method: "DELETE" },
  );

// submit / approve / reject / cancel / send all act on an order and return it
export const runAction = async (
  id: string,
  action: "submit" | "approve" | "reject" | "cancel" | "send",
  body?: unknown,
) =>
  (
    await apiRequest<MutationResponse<PurchaseOrder>>(
      "procurement",
      `${base}/${id}/${action}`,
      { method: "POST", body: body ?? {} },
    )
  ).data;

export const deleteDraft = (id: string) =>
  apiRequest<MutationResponse<unknown>>("procurement", `${base}/${id}`, {
    method: "DELETE",
  });

// From Vendor Management: who we may order from, and what they sell.
// The list endpoint has returned both a bare array and a paged object, so accept either.
export const getSuppliers = async () => {
  const response = await apiRequest<Supplier[] | { data: Supplier[] }>(
    "vendor",
    "/suppliers",
  );

  return Array.isArray(response) ? response : response.data;
};

export const getSupplierCatalog = async (supplierId: string) => {
  const response = await apiRequest<
    | { id: string; productId: string; name: string; unitPrice: number }[]
    | { data: { id: string; productId: string; name: string; unitPrice: number }[] }
  >("vendor", `/suppliers/${supplierId}/catalog-items`);

  return Array.isArray(response) ? response : response.data;
};
