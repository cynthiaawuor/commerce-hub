import { apiRequest, type MutationResponse } from "../../lib/api-client";
import type {
  CreateSupplierInput,
  Paginated,
  Supplier,
  SupplierQuery,
  UpdateSupplierInput,
} from "../../types/supplier";

export const getSuppliers = (params: SupplierQuery) => {
  const queryString = new URLSearchParams();
  queryString.set("page", String(params.page));
  queryString.set("limit", String(params.limit));

  if (params.search?.trim()) {
    queryString.set("search", params.search.trim());
  }

  if (params.status?.trim()) queryString.set("status", params.status.trim());

  return apiRequest<Paginated<Supplier>>(
    "vendor",
    `/suppliers?${queryString.toString()}`,
  );
};

export const getSupplier = (id: string) =>
  apiRequest<Supplier>("vendor", `/suppliers/${encodeURIComponent(id)}`);

export const createSupplier = async (input: CreateSupplierInput) => {
  const response = await apiRequest<MutationResponse<Supplier>>(
    "vendor",
    "/suppliers",
    { method: "POST", body: input },
  );
  return response.data;
};

export const updateSupplier = async (
  id: string,
  input: UpdateSupplierInput,
) => {
  const response = await apiRequest<MutationResponse<Supplier>>(
    "vendor",
    `/suppliers/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: input,
    },
  );
  return response.data;
};

export const deleteSupplier = (id: string) =>
  apiRequest<{ message: string }>(
    "vendor",
    `/suppliers/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
