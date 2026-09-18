import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../core/http-error";
import parseAndValidate from "../core/validation";
import { isUniqueViolation } from "../prisma/db";
import { CreateSupplierDto } from "./dtos/create-supplier.dto";
import { ListSuppliersQueryDto } from "./dtos/list-suppliers-query.dto";
import { UpdateSupplierDto } from "./dtos/update-supplier.dto";
import * as supplierRepository from "./suppliers.repository";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

// email is the only unique column on Supplier, so a unique violation means a duplicate email.
const rethrowDuplicateEmail = (err: unknown, email?: string): never => {
  if (isUniqueViolation(err)) {
    throw new ConflictError(`Supplier with email ${email} already exists`);
  }

  throw err;
};

// For operations that only need to know the supplier is there, not what it contains
const assertSupplierExists = async (id: string) => {
  if (!(await supplierRepository.existsById(id))) {
    throw new NotFoundError(`Supplier with ID ${id} not found`);
  }
};

const getSuppliers = async (query: unknown = {}) => {
  const { obj, errors } = await parseAndValidate(ListSuppliersQueryDto, query);

  if (errors) {
    throw new BadRequestError("Unprocessable list query", errors);
  }

  const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, search, status } = obj!;

  const filters = { search, status };

  const [data, total] = await Promise.all([
    supplierRepository.findPage(filters, (page - 1) * limit, limit),
    supplierRepository.count(filters),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

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

  await assertSupplierExists(id);

  return supplierRepository
    .update(id, obj!)
    .catch((err) => rethrowDuplicateEmail(err, obj!.email));
};

const deleteSupplier = async (id: string) => {
  await assertSupplierExists(id);

  await supplierRepository.remove(id);
};

export {
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplier,
  getSuppliers,
};
