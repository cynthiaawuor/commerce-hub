// Mirrors the Supplier model in service-vendor/src/prisma/contract.prisma
export type SupplierStatus = "ACTIVE" | "INACTIVE";

export type Supplier = {
  id: string;
  name: string;
  email: string;
  phone: string;
  paymentTerms: string;
  status: SupplierStatus;
  createdAt: string;
  updatedAt: string;
};

export type SupplierQuery = {
  page: number;
  limit: number;
  search?: string;
  status?: SupplierStatus;
};

export type Paginated<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type CreateSupplierInput = Pick<
  Supplier,
  "name" | "email" | "phone" | "paymentTerms"
>;

export type UpdateSupplierInput = Partial<
  CreateSupplierInput & { status: SupplierStatus }
>;
