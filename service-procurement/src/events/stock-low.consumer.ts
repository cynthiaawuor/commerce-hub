import type { EventEnvelope } from "./event-publisher";
import { subscribe } from "./event-consumer";
import * as reorderSuggestionService from "../reorder-suggestions/reorder-suggestions.service";
import { PermanentEventError } from "./outbox-errors";

// The shape Inventory publishes; see contracts/events/stock-low.md
type StockLowPayload = {
  productId: string;
  productName: string;
  locationId: string;
  quantityAvailable: number;
  reorderPoint: number;
  reorderQuantity: number;
};

const QUEUE = "procurement.stock-low";
const ROUTING_KEY = "inventory.stock-low";

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isCount = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 0;

// A payload missing fields will be missing them on every retry
const parseStockLowPayload = (payload: unknown): StockLowPayload => {
  const p = payload as Partial<StockLowPayload> | null;

  if (
    !p ||
    !isText(p.productId) ||
    !isText(p.productName) ||
    !isText(p.locationId) ||
    !isCount(p.quantityAvailable) ||
    !isCount(p.reorderPoint) ||
    !isCount(p.reorderQuantity)
  ) {
    throw new PermanentEventError(
      "StockLow payload does not match contracts/events/stock-low.md",
    );
  }

  return p as StockLowPayload;
};

const handleStockLow = async (envelope: EventEnvelope) => {
  const payload = parseStockLowPayload(envelope.payload);

  await reorderSuggestionService.recordShortage({
    productId: payload.productId,
    productName: payload.productName,
    locationId: payload.locationId,
    quantityAvailable: payload.quantityAvailable,
    reorderPoint: payload.reorderPoint,
    suggestedQuantity: payload.reorderQuantity,
  });

  console.log(
    `Reorder suggestion raised for ${payload.productId} at ${payload.locationId}`,
  );
};

const startStockLowConsumer = () =>
  subscribe({ queue: QUEUE, routingKey: ROUTING_KEY, handle: handleStockLow });

export { QUEUE, ROUTING_KEY, handleStockLow, startStockLowConsumer };
