import { BadRequestError, NotFoundError } from "../core/http-error";
import parseAndValidate from "../core/validation";
import { db } from "../prisma/db";
import { CreateCatalogItemDto } from "./dtos/create-catalog-item.dto";
import { UpdateCatalogItemDto } from "./dtos/update-catalog-item.dto";

// Catalog items always belong to a supplier, so every lookup is scoped by supplierId.
const assertSupplierExists = async (supplierId: string) => {
  const supplier = await db.orm.public.Supplier.where({ id: supplierId }).first();

  if (!supplier) {
    throw new NotFoundError(`Supplier with ID ${supplierId} not found`);
  }
};

const getCatalogItems = async (supplierId: string) => {
  await assertSupplierExists(supplierId);

  return db.orm.public.CatalogItem.where({ supplierId }).all();
};

const getCatalogItem = async (supplierId: string, id: string) => {
  await assertSupplierExists(supplierId);

  const catalogItem = await db.orm.public.CatalogItem.where({ id, supplierId }).first();

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

  // supplierId comes from the route, never from the body
  return db.orm.public.CatalogItem.create({ ...obj!, supplierId });
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

  // Pin supplierId so an item can't be moved to another supplier through the body
  return db.orm.public.CatalogItem.where({ id, supplierId }).update({ ...obj!, supplierId });
};

const deleteCatalogItem = async (supplierId: string, id: string) => {
  await getCatalogItem(supplierId, id);

  await db.orm.public.CatalogItem.where({ id, supplierId }).delete();
};

export {
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  getCatalogItem,
  getCatalogItems,
};
