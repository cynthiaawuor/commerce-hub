import "dotenv/config";
import { createApp } from "./app";
import { config } from "./core/config";
import { closeConsumers } from "./events/event-consumer";
import { startOutboxWorker, stopOutboxWorker } from "./events/outbox-worker";
import { startPurchaseOrderApprovedConsumer } from "./events/purchase-order-approved.consumer";

const PORT = process.env["PORT"] || 3003;

const server = createApp().listen(PORT, () => {
  console.log(`Receiving service is running at http://localhost:${PORT}`);

  if (!config.featureReceiving) {
    console.log(
      "FEATURE_RECEIVING is off: routes and event handling are disabled",
    );
    return;
  }
  //TODO
  startOutboxWorker();

  // Listening is best-effort at startup: if the broker is down the service still serves
  // HTTP, and events wait in RabbitMQ until it is back.
  startPurchaseOrderApprovedConsumer().catch((err) =>
    console.error("Could not subscribe to PurchaseOrderApproved events:", err),
  );
});

const shutdown = async () => {
  await stopOutboxWorker();
  await closeConsumers();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
