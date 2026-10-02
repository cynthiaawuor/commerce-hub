import "dotenv/config";
import { createApp } from "./app";
import { config } from "./core/config";
import { startDayClosedConsumer } from "./events/day-closed.consumer";
import { closeConsumers } from "./events/event-consumer";
import { startGoodsReceivedConsumer } from "./events/goods-received.consumer";
import { startItemSoldConsumer } from "./events/item-sold.consumer";
import { startPurchaseOrderApprovedConsumer } from "./events/purchase-order-approved.consumer";
import { startCostingWorker, stopCostingWorker } from "./sales/costing-worker";

const PORT = process.env["PORT"] || 3007;

// One at a time: the consumers share a channel that the first subscription opens
const startConsumers = async () => {
  await startPurchaseOrderApprovedConsumer();
  await startGoodsReceivedConsumer();
  await startItemSoldConsumer();
  await startDayClosedConsumer();
};

const server = createApp().listen(PORT, () => {
  console.log(`Financials service is running at http://localhost:${PORT}`);

  if (!config.featureFinancials) {
    console.log("FEATURE_FINANCIALS is off: routes and event handling are disabled");
    return;
  }

  startCostingWorker();

  // Listening is best-effort at startup: if the broker is down the service still serves
  // its reports, and events wait in RabbitMQ until it is back.
  startConsumers().catch((err) => console.error("Could not subscribe to events:", err));
});

const shutdown = async () => {
  stopCostingWorker();
  await closeConsumers();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
