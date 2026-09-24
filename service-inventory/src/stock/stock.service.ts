import type { CurrentUser } from "../core/current-user";
import { BadRequestError, ConflictError, NotFoundError } from "../core/http-error";
import parseAndValidate from "../core/validation";
import * as locationRepository from "../locations/locations.repository";
import * as productRepository from "../products/products.repository";
import { AdjustStockDto } from "./dtos/adjust-stock.dto";
import * as stockRepository from "./stock.repository";

const DEFAULT_MOVEMENT_LIMIT = 50;

const assertProductExists = async (productId: string) => {
  if (!(await productRepository.existsById(productId))) {
    throw new NotFoundError(`Product with ID ${productId} not found`);
  }
};

const assertLocationExists = async (locationId: string) => {
  if (!(await locationRepository.existsById(locationId))) {
    throw new NotFoundError(`Location with ID ${locationId} not found`);
  }
};

// Where a product is, across every location holding it
const getStockByProduct = async (productId: string) => {
  await assertProductExists(productId);

  return stockRepository.findLevelsByProduct(productId);
};

// What a location holds
const getStockByLocation = async (locationId: string) => {
  await assertLocationExists(locationId);

  return stockRepository.findLevelsByLocation(locationId);
};

const getMovements = async (
  productId: string,
  locationId?: string | undefined,
  limit = DEFAULT_MOVEMENT_LIMIT,
) => {
  await assertProductExists(productId);

  return stockRepository.findMovements(productId, locationId, limit);
};

// The manual correction path: a stock count, damage, shrinkage. Receipts and sales
// arrive as events (stage 5) rather than through here.
const adjustStock = async (body: unknown, user: CurrentUser) => {
  const { obj, errors } = await parseAndValidate(AdjustStockDto, body);

  if (errors) {
    throw new BadRequestError("Unprocessable stock adjustment", errors);
  }

  const { productId, locationId, quantity, reason, reference } = obj!;

  if (quantity === 0) {
    throw new BadRequestError("An adjustment of zero would record nothing");
  }

  await assertProductExists(productId);
  await assertLocationExists(locationId);

  // Stock cannot go below zero: the business cannot hold minus three sacks of flour.
  // An adjustment may still leave onHand under what is reserved (stock damaged after it
  // was promised to a sale), which shows as zero available until a till releases it.
  const level = await stockRepository.findLevel(productId, locationId);
  const onHand = (level?.onHand ?? 0) + quantity;

  if (onHand < 0) {
    throw new ConflictError(
      `Cannot remove ${Math.abs(quantity)}: only ${level?.onHand ?? 0} on hand at this location`,
    );
  }

  return stockRepository.applyMovement({
    productId,
    locationId,
    type: "ADJUSTMENT",
    quantity,
    reason,
    reference: reference ?? null,
    recordedBy: user.id,
  });
};

export { adjustStock, getMovements, getStockByLocation, getStockByProduct };
