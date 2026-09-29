import "dotenv/config";
import { createApp } from "./app";
import { config } from "./core/config";
import { closeConsumers } from "./events/event-consumer";
import { startGoodsReceivedConsumer } from "./events/goods-received.consumer";

const PORT = process.env["PORT"] || 3004;

const server = createApp().listen(PORT, () => {
  console.log(`Warehouse service is running at http://localhost:${PORT}`);

  if (!config.featureWarehouse) {
    console.log("FEATURE_WAREHOUSE is off: routes and event handling are disabled");
    return;
  }

  // Listening is best-effort at startup: if the broker is down the service still serves
  // HTTP, and events wait in RabbitMQ until it is back.
  startGoodsReceivedConsumer().catch((err) =>
    console.error("Could not subscribe to GoodsReceived events:", err),
  );
});

const shutdown = async () => {
  await closeConsumers();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
