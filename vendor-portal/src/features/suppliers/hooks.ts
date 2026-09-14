import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateSupplierInput,
  UpdateSupplierInput,
} from "../../types/supplier";
import {
  createSupplier,
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
