import "dotenv/config";
import { createApp } from "./app";
import { config } from "./core/config";
import { closeConsumers } from "./events/event-consumer";
import { startItemSoldConsumer } from "./events/item-sold.consumer";
import { startOutboxWorker, stopOutboxWorker } from "./events/outbox-worker";

const PORT = process.env["PORT"] || 3006;

const server = createApp().listen(PORT, () => {
  console.log(`Sales audit service is running at http://localhost:${PORT}`);

  if (!config.featureSalesAudit) {
    console.log("FEATURE_SALES_AUDIT is off: routes and event handling are disabled");
    return;
  }

  startOutboxWorker();

  // Listening is best-effort at startup: if the broker is down the service still serves
  // HTTP, and events wait in RabbitMQ until it is back.
  startItemSoldConsumer().catch((err) =>
    console.error("Could not subscribe to ItemSold events:", err),
  );
});

// Close broker connections cleanly so in-flight publishes are not cut off
const shutdown = async () => {
  await stopOutboxWorker();
  await closeConsumers();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
