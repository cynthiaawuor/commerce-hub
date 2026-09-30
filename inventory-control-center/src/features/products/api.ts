import { apiRequest, type MutationResponse } from "../../lib/api-client";
import type { PageMeta, Product } from "../../types/inventory";

export const getProducts = (page: number, search: string) => {
  const query = new URLSearchParams({ page: String(page), limit: "10" });
  if (search.trim()) query.set("search", search.trim());

  return apiRequest<{ data: Product[]; meta: PageMeta }>(
    `/products?${query.toString()}`,
  );
};

export type ProductInput = {
  sku: string;
  name: string;
  unitOfMeasure?: string;
  weightG?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
};

export const createProduct = async (input: ProductInput) =>
  (await apiRequest<MutationResponse<Product>>("/products", {
    method: "POST",
    body: input,
  })).data;

export const updateProduct = async (
  id: string,
  input: Partial<ProductInput> & { isActive?: boolean },
) =>
  (await apiRequest<MutationResponse<Product>>(`/products/${id}`, {
    method: "PATCH",
    body: input,
  })).data;
