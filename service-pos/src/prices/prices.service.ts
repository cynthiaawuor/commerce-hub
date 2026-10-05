import type { CurrentUser } from "../core/current-user";
import { BadRequestError, ConflictError, ForbiddenError } from "../core/http-error";
import parseAndValidate from "../core/validation";
import * as inventoryClient from "../inventory/inventory.client";
import { SetPriceDto } from "./dtos/set-price.dto";
import * as priceRepository from "./prices.repository";

const listPrices = async () => priceRepository.findAll();

// A manager prices a product by its SKU. Inventory confirms the product exists and
// gives its id and name, so the till sells exactly what Inventory holds.
const setPrice = async (sku: string, body: unknown, user: CurrentUser) => {
  if (user.role !== "MANAGER") {
    throw new ForbiddenError("Only a manager can set prices");
  }

  const { obj, errors } = await parseAndValidate(SetPriceDto, body);

  if (errors) {
    throw new BadRequestError("Invalid price", errors);
  }

  const product = await inventoryClient.getProductBySku(sku.trim().toUpperCase());

  if (!product.isActive) {
    throw new ConflictError(`${product.name} is no longer sold`);
  }

  return priceRepository.save({
    productId: product.id,
    sku: product.sku,
    productName: product.name,
    priceCents: obj!.priceCents,
    updatedBy: user.id,
  });
};

export { listPrices, setPrice };
