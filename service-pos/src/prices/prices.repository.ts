import { db } from "../prisma/db";

const ProductPrice = db.orm.public.ProductPrice;

type NewPrice = {
  productId: string;
  sku: string;
  productName: string;
  priceCents: number;
  updatedBy: string;
};

// Alphabetical, the way a cashier looks for a product with no barcode
const findAll = async () =>
  ProductPrice.orderBy((price) => price.productName.asc()).all();

const findBySku = async (sku: string) => ProductPrice.where({ sku }).first();

// One price per product: setting it again replaces the old one
const save = async (price: NewPrice) => {
  const existing = await ProductPrice.where({ productId: price.productId }).first();

  if (existing) {
    return ProductPrice.where({ id: existing.id }).update(price);
  }

  return ProductPrice.create(price);
};

export { findAll, findBySku, save };
