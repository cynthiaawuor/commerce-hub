import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../core/http-error";
import parseAndValidate from "../core/validation";
import { db, isUniqueViolation } from "../prisma/db";
import { CreateSupplierDto } from "./dtos/create-supplier.dto";
import { UpdateSupplierDto } from "./dtos/update-supplier.dto";

// email is the only unique column on Supplier, so a unique violation means a duplicate email.
const rethrowDuplicateEmail = (err: unknown, email?: string): never => {
  if (isUniqueViolation(err)) {
    throw new ConflictError(`Supplier with email ${email} already exists`);
  }

  throw err;
};

const getSuppliers = async () => db.orm.public.Supplier.all();

const getSupplier = async (id: string) => {
  const supplier = await db.orm.public.Supplier.where({ id }).first();

  if (!supplier) {
    throw new NotFoundError(`Supplier with ID ${id} not found`);
  }

  return supplier;
};

const createSupplier = async (createSupplierDto: CreateSupplierDto) => {
  const { obj, errors } = await parseAndValidate(
    CreateSupplierDto,
    createSupplierDto,
  );

  if (errors) {
    throw new BadRequestError("Unprocessable supplier details", errors);
  }

  return await db.orm.public.Supplier.create(obj!).catch((err) =>
    rethrowDuplicateEmail(err, obj!.email),
  );
};

const updateSupplier = async (
  id: string,
  updateSupplierDto: UpdateSupplierDto,
) => {
  const { obj, errors } = await parseAndValidate(
    UpdateSupplierDto,
    updateSupplierDto,
  );

  if (errors) {
    throw new BadRequestError("Unprocessable supplier details", errors);
  }

  await getSupplier(id);

  return db.orm.public.Supplier.where({ id })
    .update(obj!)
    .catch((err) => rethrowDuplicateEmail(err, obj!.email));
};

const deleteSupplier = async (id: string) => {
  await getSupplier(id);

  await db.orm.public.Supplier.where({ id }).delete();
};

export {
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplier,
  getSuppliers,
};
