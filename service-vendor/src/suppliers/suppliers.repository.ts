import { db } from "../prisma/db";
import type { CreateSupplierDto } from "./dtos/create-supplier.dto";
import type { UpdateSupplierDto } from "./dtos/update-supplier.dto";

const Supplier = db.orm.public.Supplier;

const findAll = async () => Supplier.all();

// Returns null when no supplier has this id
const findById = async (id: string) => Supplier.where({ id }).first();

const insert = async (supplier: CreateSupplierDto) => Supplier.create(supplier);

const update = async (id: string, supplier: UpdateSupplierDto) =>
  Supplier.where({ id }).update(supplier);

const remove = async (id: string) => {
  await Supplier.where({ id }).delete();
};

export { findAll, findById, insert, update, remove };
