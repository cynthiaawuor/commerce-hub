import { useQuery } from "@tanstack/react-query";
import * as api from "./api";

export const useProductSearch = (search: string) =>
  useQuery({
    queryKey: ["inventory-products", search],
    queryFn: () => api.searchProducts(search),
    // Results for a given search barely change while a form is open
    staleTime: 30_000,
  });

// Used when editing an item, to show which product was chosen rather than its id
export const useProduct = (id: string) =>
  useQuery({
    queryKey: ["inventory-products", "detail", id],
    queryFn: () => api.getProduct(id),
    enabled: Boolean(id),
    retry: false,
  });
