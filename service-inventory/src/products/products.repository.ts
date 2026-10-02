import { or } from "@prisma/orm-family-sql/orm-client";
import { db } from "../prisma/db";
import type { CreateProductDto } from "./dtos/create-product.dto";
import type { UpdateProductDto } from "./dtos/update-product.dto";

const Product = db.orm.public.Product;

type ProductFilters = {
  search?: string | undefined;
  isActive?: boolean | undefined;
};

// Built in one place so a page of products and the total always apply the same filters
const filtered = ({ search, isActive }: ProductFilters) => {
  // isNotNull() on the primary key matches every row: a starting point to chain onto
  let products = Product.where((product) => product.id.isNotNull());

  if (isActive !== undefined) {
    products = products.where({ isActive });
  }

  if (search) {
    products = products.where((product) =>
      or(product.sku.ilike(`%${search}%`), product.name.ilike(`%${search}%`)),
    );
  }

  return products;
};

const findPage = async (filters: ProductFilters, offset: number, limit: number) =>
  filtered(filters)
    .orderBy([(product) => product.name.asc(), (product) => product.id.asc()])
    .offset(offset)
    .limit(limit)
    .all();

const count = async (filters: ProductFilters = {}) =>
  (await filtered(filters).aggregate((a) => ({ total: a.count() }))).total;

// Returns null when no product has this id
const findById = async (id: string) => Product.where({ id }).first();

const findBySku = async (sku: string) => Product.where({ sku }).first();

// Selects only the id column, so callers that just need a yes/no never fetch the row
const existsById = async (id: string) =>
  (await Product.where({ id }).select("id").first()) !== null;

const insert = async (product: CreateProductDto) => Product.create(product);

const update = async (id: string, product: Partial<UpdateProductDto>) =>
  Product.where({ id }).update(product);

export {
  count,
  existsById,
  findById,
  findBySku,
  findPage,
  insert,
  update,
  type ProductFilters,
};
