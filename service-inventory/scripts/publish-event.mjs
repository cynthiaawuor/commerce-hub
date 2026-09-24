// Stands in for Procurement and Receiving while testing Inventory by hand.
//
//   node scripts/publish-event.mjs purchase-order-approved MAIZE-2KG 100
//   node scripts/publish-event.mjs goods-received MAIZE-2KG 95 125050 WH-MAIN
//   node scripts/publish-event.mjs goods-received MAIZE-2KG 95 125050 WH-MAIN GRN-500 <eventId>
import { randomUUID } from "node:crypto";
import amqplib from "amqplib";

const [kind, product = "MAIZE-2KG", quantity = "10", unitCostCents = "125050",
       location = "WH-MAIN", reference = `GRN-${Math.floor(Math.random() * 1000)}`,
       eventId = randomUUID()] = process.argv.slice(2);

const events = {
  "purchase-order-approved": {
    eventType: "PurchaseOrderApproved",
    routingKey: "procurement.purchase-order-approved",
    payload: {
      purchaseOrderId: randomUUID(),
      poNumber: reference.startsWith("PO-") ? reference : "PO-000999",
      supplierId: "sup-1",
      lines: [{
        productId: product,
        productName: product,
        quantityOrdered: Number(quantity),
        unitCostCents: Number(unitCostCents),
        leadTimeDays: 7,
      }],
    },
  },
  "goods-received": {
    eventType: "GoodsReceived",
    routingKey: "receiving.goods-received",
    payload: {
      grnId: reference,
      purchaseOrderId: "PO-000999",
      locationId: location,
      receivedAt: new Date().toISOString(),
      lines: [{
        productId: product,
        quantityReceived: Number(quantity),
        unitCostCents: Number(unitCostCents),
      }],
    },
  },
};

const event = events[kind];

if (!event) {
  console.error(`Unknown event "${kind}". Use: ${Object.keys(events).join(", ")}`);
  process.exit(1);
}

const connection = await amqplib.connect(
  process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672",
);
const channel = await connection.createChannel();
await channel.assertExchange("commerce.events", "topic", { durable: true });

channel.publish(
  "commerce.events",
  event.routingKey,
  Buffer.from(JSON.stringify({
    eventId,
    eventType: event.eventType,
    aggregateId: product,
    occurredAt: new Date().toISOString(),
    payload: event.payload,
  })),
  { persistent: true, contentType: "application/json" },
);

console.log(`Published ${event.eventType} (eventId ${eventId})`);
await channel.close();
await connection.close();
