import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateCatalogItemInput, UpdateCatalogItemInput } from "../../types/catalog-item";
import { createCatalogItem, deleteCatalogItem, getCatalogItems, updateCatalogItem } from "./api";

export const catalogKeys = {
  list: (supplierId: string) => ["suppliers", supplierId, "catalog-items"] as const,
};

export function useCatalogItems(supplierId: string) {
  return useQuery({ queryKey: catalogKeys.list(supplierId), queryFn: () => getCatalogItems(supplierId) });
}

// All catalog mutations refresh the supplier's catalog list when they succeed.
function useCatalogMutation<TVariables>(supplierId: string, mutationFn: (variables: TVariables) => Promise<unknown>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: catalogKeys.list(supplierId) }),
  });
}

export function useCreateCatalogItem(supplierId: string) {
  return useCatalogMutation(supplierId, (input: CreateCatalogItemInput) => createCatalogItem(supplierId, input));
}

export function useUpdateCatalogItem(supplierId: string) {
  return useCatalogMutation(supplierId, ({ id, input }: { id: string; input: UpdateCatalogItemInput }) =>
    updateCatalogItem(supplierId, id, input),
  );
}

export function useDeleteCatalogItem(supplierId: string) {
  return useCatalogMutation(supplierId, (id: string) => deleteCatalogItem(supplierId, id));
}
