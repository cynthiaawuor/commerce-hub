import { NotFoundError } from "../core/http-error";
import * as locationRepository from "../locations/locations.repository";
import * as valuationRepository from "./valuation.repository";
import { summarise, toValuationLines, type ValuedLevel } from "./valuation";

// Flattens what the database returns into the shape the maths works on
const toValuedLevels = (
  rows: Awaited<ReturnType<typeof valuationRepository.findValuedLevels>>,
): ValuedLevel[] =>
  rows.map((row) => ({
    locationId: row.location.id,
    locationCode: row.location.code,
    locationName: row.location.name,
    productId: row.product.id,
    sku: row.product.sku,
    productName: row.product.name,
    onHand: row.onHand,
    averageCostCents: row.product.averageCostCents,
  }));

const assertLocationExists = async (locationId: string) => {
  if (!(await locationRepository.existsById(locationId))) {
    throw new NotFoundError(`Location with ID ${locationId} not found`);
  }
};

// "What is the stock worth?" — the whole business, or one location
const getValuationSummary = async (locationId?: string | undefined) => {
  if (locationId) {
    await assertLocationExists(locationId);
  }

  const levels = await valuationRepository.findValuedLevels(locationId);

  return summarise(toValuedLevels(levels));
};

// The same figure, broken down to the lines it is made of
const getValuationLines = async (locationId?: string | undefined) => {
  if (locationId) {
    await assertLocationExists(locationId);
  }

  const levels = await valuationRepository.findValuedLevels(locationId);

  return toValuationLines(toValuedLevels(levels));
};

export { getValuationLines, getValuationSummary };
