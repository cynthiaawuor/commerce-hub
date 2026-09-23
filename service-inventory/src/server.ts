import "dotenv/config";
import { createApp } from "./app";
import { config } from "./core/config";

const PORT = process.env["PORT"] || 3002;

const server = createApp().listen(PORT, () => {
  console.log(`Inventory service is running at http://localhost:${PORT}`);

  if (!config.featureInventory) {
    console.log("FEATURE_INVENTORY is off: routes and event handling are disabled");
  }
});

// Event workers are started here from stage 5; shutdown closes them cleanly
const shutdown = async () => {
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
