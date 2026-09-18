import { db } from "../prisma/db";
import type { CreateCatalogItemDto } from "./dtos/create-catalog-item.dto";
import type { UpdateCatalogItemDto } from "./dtos/update-catalog-item.dto";

const CatalogItem = db.orm.public.CatalogItem;

const findAllBySupplier = async (supplierId: string) =>
  CatalogItem.where({ supplierId }).all();

// Scoped by supplierId as well as id, so one supplier can never read another's item.
// Returns null when there is no such item.
const findById = async (supplierId: string, id: string) =>
  CatalogItem.where({ id, supplierId }).first();

// supplierId comes from the route, never from the body
const insert = async (supplierId: string, item: CreateCatalogItemDto) =>
  CatalogItem.create({ ...item, supplierId });

// Pin supplierId so an item can't be moved to another supplier through the body
const update = async (
  supplierId: string,
  id: string,
  item: UpdateCatalogItemDto,
) => CatalogItem.where({ id, supplierId }).update({ ...item, supplierId });

const remove = async (supplierId: string, id: string) => {
  await CatalogItem.where({ id, supplierId }).delete();
};

// Every supplier that lists this product, with the supplier attached so the service can
// drop inactive ones. Procurement uses this when a buyer orders a product.
const findByProductId = async (productId: string) =>
  CatalogItem.where({ productId })
    .include("supplier", (supplier) =>
      supplier.select("id", "name", "status", "paymentTerms"),
    )
    .all();

export { findAllBySupplier, findByProductId, findById, insert, update, remove };
