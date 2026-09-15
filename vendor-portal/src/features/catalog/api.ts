import { apiRequest, type MutationResponse } from "../../lib/api-client";
import type { CatalogItem, CreateCatalogItemInput, UpdateCatalogItemInput } from "../../types/catalog-item";

const basePath = (supplierId: string) => `/suppliers/${encodeURIComponent(supplierId)}/catalog-items`;

export const getCatalogItems = (supplierId: string) => apiRequest<CatalogItem[]>("vendor", basePath(supplierId));

export const createCatalogItem = async (supplierId: string, input: CreateCatalogItemInput) => {
  const response = await apiRequest<MutationResponse<CatalogItem>>("vendor", basePath(supplierId), {
    method: "POST",
    body: input,
  });
  return response.data;
};

export const updateCatalogItem = async (supplierId: string, id: string, input: UpdateCatalogItemInput) => {
  const response = await apiRequest<MutationResponse<CatalogItem>>(
    "vendor",
    `${basePath(supplierId)}/${encodeURIComponent(id)}`,
    { method: "PUT", body: input },
  );
  return response.data;
};

export const deleteCatalogItem = (supplierId: string, id: string) =>
  apiRequest<{ message: string }>("vendor", `${basePath(supplierId)}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
