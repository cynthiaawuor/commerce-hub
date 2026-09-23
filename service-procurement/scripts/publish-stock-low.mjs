// Stands in for the Inventory service until it exists: publishes a StockLow event
// matching contracts/events/stock-low.md.
//
//   node scripts/publish-stock-low.mjs PROD-7387 "Maize flour 2kg" WH-MAIN 12 20 100
import { randomUUID } from "node:crypto";
import amqplib from "amqplib";

const [
  productId = "PROD-7387",
  productName = "Maize flour 2kg",
  locationId = "WH-MAIN",
  quantityAvailable = "12",
  reorderPoint = "20",
  reorderQuantity = "100",
] = process.argv.slice(2);

const url = process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672";
const connection = await amqplib.connect(url);
const channel = await connection.createChannel();
await channel.assertExchange("commerce.events", "topic", { durable: true });

const envelope = {
  eventId: randomUUID(),
  eventType: "StockLow",
  aggregateId: productId,
  occurredAt: new Date().toISOString(),
  payload: {
    productId,
    productName,
    locationId,
    quantityAvailable: Number(quantityAvailable),
    reorderPoint: Number(reorderPoint),
    reorderQuantity: Number(reorderQuantity),
  },
};

channel.publish(
  "commerce.events",
  "inventory.stock-low",
  Buffer.from(JSON.stringify(envelope)),
  { persistent: true, contentType: "application/json" },
);

console.log(`Published StockLow for ${productId} at ${locationId}`);
await channel.close();
await connection.close();
