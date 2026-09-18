import { or } from "@prisma/orm-postgres/orm-client";
import { db } from "../prisma/db";
import type { CreateSupplierDto } from "./dtos/create-supplier.dto";
import type { UpdateSupplierDto } from "./dtos/update-supplier.dto";
import type SupplierStatus from "./supplier-status.enum";

const Supplier = db.orm.public.Supplier;

type SupplierFilters = {
  search?: string | undefined;
  status?: SupplierStatus | undefined;
};

const filteredSuppliers = ({ search, status }: SupplierFilters) => {
  let suppliers = Supplier.where((s) => s.id.isNotNull());

  if (status) {
    suppliers = suppliers.where({ status });
  }
  if (search) {
    suppliers = suppliers.where((s) =>
      or(s.name.ilike(`%${search}%`), s.email.ilike(`%${search}%`)),
    );
  }
  return suppliers;
};

const findPage = async (
  filters: SupplierFilters,
  page: number,
  pageSize: number,
) => {
  const safePage = Math.max(1, Math.floor(Number(page) || 1));
  const safeSize = Math.min(
    100,
    Math.max(1, Math.floor(Number(pageSize) || 10)),
  );
  const offset = (safePage - 1) * safeSize;

  const query = filteredSuppliers(filters);

  const suppliers = await query
    .orderBy([(s) => s.name.asc(), (s) => s.id.asc()])
    .limit(safeSize)
    .offset(offset)
    .all();
  return suppliers;
};

const count = async (filters: SupplierFilters) =>
  (await filteredSuppliers(filters).aggregate((a) => ({ total: a.count() })))
    .total;

// Returns null when no supplier has this id
const findById = async (id: string) => Supplier.where({ id }).first();

const existsById = async (id: string) =>
  (await Supplier.where({ id }).select("id").first()) !== null;

const insert = async (supplier: CreateSupplierDto) => Supplier.create(supplier);

const update = async (id: string, supplier: UpdateSupplierDto) =>
  Supplier.where({ id }).update(supplier);

const remove = async (id: string) => {
  await Supplier.where({ id }).delete();
};

export { findPage, count, findById, insert, update, remove, existsById };
