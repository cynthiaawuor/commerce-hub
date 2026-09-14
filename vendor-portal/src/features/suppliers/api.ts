import { apiRequest, type MutationResponse } from "../../lib/api-client";
import type {
  CreateSupplierInput,
  Supplier,
  UpdateSupplierInput,
} from "../../types/supplier";

export const getSuppliers = () =>
  apiRequest<Supplier[]>("vendor", "/suppliers");

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
