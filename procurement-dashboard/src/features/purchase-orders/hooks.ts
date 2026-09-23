import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../lib/api-client";
import type { PurchaseOrderStatus } from "../../types/purchase-order";
import * as api from "./api";

// Keys are a tree: invalidating ["purchase-orders"] refreshes lists and details alike.
export const purchaseOrderKeys = {
  all: ["purchase-orders"] as const,
  list: (page: number, status?: PurchaseOrderStatus) =>
    ["purchase-orders", "list", { page, status }] as const,
  detail: (id: string) => ["purchase-orders", "detail", id] as const,
  history: (id: string) => ["purchase-orders", "detail", id, "history"] as const,
};

export const usePurchaseOrders = (page: number, status?: PurchaseOrderStatus) =>
  useQuery({
    queryKey: purchaseOrderKeys.list(page, status),
    queryFn: () => api.getPurchaseOrders({ page, status }),
  });

export const usePurchaseOrder = (id: string) =>
  useQuery({
    queryKey: purchaseOrderKeys.detail(id),
    queryFn: () => api.getPurchaseOrder(id),
    // A deleted or mistyped order will not appear on a retry
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status === 404) && failureCount < 1,
  });

export const usePurchaseOrderHistory = (id: string) =>
  useQuery({
    queryKey: purchaseOrderKeys.history(id),
    queryFn: () => api.getPurchaseOrderHistory(id),
  });

export const useSuppliers = () =>
  useQuery({ queryKey: ["suppliers"], queryFn: api.getSuppliers });

export const useSupplierCatalog = (supplierId: string) =>
  useQuery({
    queryKey: ["suppliers", supplierId, "catalog"],
    queryFn: () => api.getSupplierCatalog(supplierId),
    enabled: Boolean(supplierId),
  });

export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createPurchaseOrder,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all }),
  });
};

export const useAddLine = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { productId: string; quantityOrdered: number }) =>
      api.addLine(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all }),
  });
};

export const useRemoveLine = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lineId: string) => api.removeLine(id, lineId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all }),
  });
};

// One hook for every workflow action; the page decides which to call
export const usePurchaseOrderAction = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      action,
      body,
    }: {
      action: "submit" | "approve" | "reject" | "cancel" | "send";
      body?: unknown;
    }) => api.runAction(id, action, body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all }),
  });
};

export const useDeleteDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.deleteDraft,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all }),
  });
};
