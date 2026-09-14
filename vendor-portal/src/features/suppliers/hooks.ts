import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../lib/api-client";
import type {
  CreateSupplierInput,
  UpdateSupplierInput,
} from "../../types/supplier";
import {
  createSupplier,
  deleteSupplier,
  getSupplier,
  getSuppliers,
  updateSupplier,
} from "./api";

// Every supplier key starts with "suppliers", so invalidating supplierKeys.all refreshes lists and details.
export const supplierKeys = {
  all: ["suppliers"] as const,
  detail: (id: string) => ["suppliers", id] as const,
};

export function useSuppliers() {
  return useQuery({ queryKey: supplierKeys.all, queryFn: getSuppliers });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: () => getSupplier(id),
    // A missing supplier won't appear on retry, so show "not found" straight away
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status === 404) && failureCount < 1,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSupplierInput) => createSupplier(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: supplierKeys.all }),
  });
}

export function useUpdateSupplier(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSupplierInput) => updateSupplier(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: supplierKeys.all }),
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSupplier(id),
    onSuccess: (_response, id) => {
      // Drop the deleted supplier's cached detail (and catalog), then refresh the list
      queryClient.removeQueries({ queryKey: supplierKeys.detail(id) });
      return queryClient.invalidateQueries({
        queryKey: supplierKeys.all,
        exact: true,
      });
    },
  });
}
