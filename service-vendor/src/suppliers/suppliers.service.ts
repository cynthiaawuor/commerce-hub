import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../core/http-error";
import parseAndValidate from "../core/validation";
import { isUniqueViolation } from "../prisma/db";
import { CreateSupplierDto } from "./dtos/create-supplier.dto";
import { UpdateSupplierDto } from "./dtos/update-supplier.dto";
import * as supplierRepository from "./suppliers.repository";

// email is the only unique column on Supplier, so a unique violation means a duplicate email.
const rethrowDuplicateEmail = (err: unknown, email?: string): never => {
  if (isUniqueViolation(err)) {
    throw new ConflictError(`Supplier with email ${email} already exists`);
  }

  throw err;
};

const getSuppliers = async () => supplierRepository.findAll();

const getSupplier = async (id: string) => {
  const supplier = await supplierRepository.findById(id);

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

  return await supplierRepository
    .insert(obj!)
    .catch((err) => rethrowDuplicateEmail(err, obj!.email));
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

  return supplierRepository
    .update(id, obj!)
    .catch((err) => rethrowDuplicateEmail(err, obj!.email));
};

const deleteSupplier = async (id: string) => {
  await getSupplier(id);

  await supplierRepository.remove(id);
};

export {
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplier,
  getSuppliers,
};
