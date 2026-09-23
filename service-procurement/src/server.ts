import "dotenv/config";
import { createApp } from "./app";
import { config } from "./core/config";
import { closeConsumers } from "./events/event-consumer";
import { startOutboxWorker, stopOutboxWorker } from "./events/outbox-worker";
import { startStockLowConsumer } from "./events/stock-low.consumer";

const PORT = process.env["PORT"] || 3001;

const server = createApp().listen(PORT, () => {
  console.log(`Procurement service is running at http://localhost:${PORT}`);

  if (!config.featureProcurement) {
    console.log("FEATURE_PROCUREMENT is off: routes and event handling are disabled");
    return;
  }

  startOutboxWorker();

  // Listening is best-effort at startup: if the broker is down the service still serves
  // HTTP, and events queue in RabbitMQ until it is restarted.
  startStockLowConsumer().catch((err) =>
    console.error("Could not subscribe to StockLow events:", err),
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
