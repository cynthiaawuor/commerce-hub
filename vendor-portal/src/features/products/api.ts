import { apiRequest } from "../../lib/api-client";

// The slice of a product this portal needs: enough to choose one and show what was chosen
export type InventoryProduct = {
  id: string;
  sku: string;
  name: string;
  unitOfMeasure: string;
};

// Inventory owns the product master. The portal only reads it.
export const searchProducts = async (search: string) => {
  const query = new URLSearchParams({ limit: "10", isActive: "true" });
  if (search.trim()) query.set("search", search.trim());

  const response = await apiRequest<{ data: InventoryProduct[] }>(
    "inventory",
    `/products?${query.toString()}`,
  );

  return response.data;
};

export const getProduct = async (id: string) =>
  (await apiRequest<{ data: InventoryProduct }>("inventory", `/products/${id}`)).data;
