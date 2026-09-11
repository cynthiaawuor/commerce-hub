import parseAndValidate from "../core/validation";
import { db } from "../prisma/db";
import { CreateSupplierDto } from "./dtos/create-supplier.dto";
import { UpdateSupplierDto } from "./dtos/update-supplier.dto";

const getSuppliers = async () => db.orm.public.Supplier.all();

const getSupplier = async (id: string) =>
  db.orm.public.Supplier.where({ id }).first();

const createSupplier = async (createSupplierDto: CreateSupplierDto) => {
  const { obj, errors } = await parseAndValidate(
    CreateSupplierDto,
    createSupplierDto,
  );

  if (errors) {
    throw Error("Unprocessable supplier details", errors);
  }

  return await db.orm.public.Supplier.create(obj!);
};

const updateSupplier = async (
  id: string,
  updateSupplierDto: UpdateSupplierDto,
) => {
  const { obj, errors } = await parseAndValidate(
    UpdateSupplierDto,
    updateSupplierDto,
  );

  const supplier = await db.orm.public.Supplier.where({ id: id }).first();

  if (!supplier) {
    throw new Error("Supplier not found!");
  }

  if (errors) {
    throw new Error("Unprocessable supplier details", errors);
  }

  return db.orm.public.Supplier.where({ id }).update(obj!);
};

const deleteSupplier = async (id: string) => {
  try {
    await db.orm.public.Supplier.where({ id }).delete();
    return true;
  } catch (e) {
    return false;
  }
};

export {
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplier,
  getSuppliers,
};
