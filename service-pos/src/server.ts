import "dotenv/config";
import { createApp } from "./app";
import { config } from "./core/config";
import { startOutboxWorker, stopOutboxWorker } from "./events/outbox-worker";

const PORT = process.env["PORT"] || 3005;

const server = createApp().listen(PORT, () => {
  console.log(`Point of sale service is running at http://localhost:${PORT}`);

  if (!config.featurePos) {
    console.log("FEATURE_POS is off: routes and event publishing are disabled");
    return;
  }

  startOutboxWorker();
});

// Close the broker connection cleanly so in-flight publishes are not cut off
const shutdown = async () => {
  await stopOutboxWorker();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
