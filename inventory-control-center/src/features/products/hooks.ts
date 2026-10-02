import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";

export const productKeys = {
  all: ["products"] as const,
  list: (page: number, search: string) => ["products", { page, search }] as const,
};

export const useProducts = (page: number, search: string) =>
  useQuery({
    queryKey: productKeys.list(page, search),
    queryFn: () => api.getProducts(page, search),
  });

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof api.updateProduct>[1] }) =>
      api.updateProduct(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  });
};
