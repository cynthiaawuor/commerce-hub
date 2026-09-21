import type { EventEnvelope } from "./event-publisher";
import { subscribe } from "./event-consumer";
import * as reorderSuggestionService from "../reorder-suggestions/reorder-suggestions.service";

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

const handleStockLow = async (envelope: EventEnvelope) => {
  const payload = envelope.payload as StockLowPayload;

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
