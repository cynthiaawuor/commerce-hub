import { BadRequestError, NotFoundError } from "../core/http-error";
import parseAndValidate from "../core/validation";
import * as supplierRepository from "../suppliers/suppliers.repository";
import * as catalogRepository from "./catalog.repository";
import { CreateCatalogItemDto } from "./dtos/create-catalog-item.dto";
import { UpdateCatalogItemDto } from "./dtos/update-catalog-item.dto";

// Catalog items always belong to a supplier, so every lookup is scoped by supplierId.
const assertSupplierExists = async (supplierId: string) => {
  if (!(await supplierRepository.existsById(supplierId))) {
    throw new NotFoundError(`Supplier with ID ${supplierId} not found`);
  }
};

const getCatalogItems = async (supplierId: string) => {
  await assertSupplierExists(supplierId);

  return catalogRepository.findAllBySupplier(supplierId);
};

const getCatalogItem = async (supplierId: string, id: string) => {
  await assertSupplierExists(supplierId);

  const catalogItem = await catalogRepository.findById(supplierId, id);

  if (!catalogItem) {
    throw new NotFoundError(`Catalog item with ID ${id} not found`);
  }

  return catalogItem;
};

const createCatalogItem = async (
  supplierId: string,
  createCatalogItemDto: CreateCatalogItemDto,
) => {
  const { obj, errors } = await parseAndValidate(
    CreateCatalogItemDto,
    createCatalogItemDto,
  );

  if (errors) {
    throw new BadRequestError("Unprocessable catalog item details", errors);
  }

  await assertSupplierExists(supplierId);

  return catalogRepository.insert(supplierId, obj!);
};

const updateCatalogItem = async (
  supplierId: string,
  id: string,
  updateCatalogItemDto: UpdateCatalogItemDto,
) => {
  const { obj, errors } = await parseAndValidate(
    UpdateCatalogItemDto,
    updateCatalogItemDto,
  );

  if (errors) {
    throw new BadRequestError("Unprocessable catalog item details", errors);
  }

  await getCatalogItem(supplierId, id);

  return catalogRepository.update(supplierId, id, obj!);
};

const deleteCatalogItem = async (supplierId: string, id: string) => {
  await getCatalogItem(supplierId, id);

  await catalogRepository.remove(supplierId, id);
};

export {
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  getCatalogItem,
  getCatalogItems,
};
