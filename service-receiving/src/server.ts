import "dotenv/config";
import { createApp } from "./app";
import { config } from "./core/config";

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
  // Event consumers and the outbox worker are started here in part 2
});

const shutdown = async () => {
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
