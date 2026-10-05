// The broker, Inventory, and the knobs this service needs. Set per environment; see .env.example.
export const config = {
  rabbitmqUrl:
    process.env["RABBITMQ_URL"] ?? "amqp://guest:guest@localhost:5672",

  outboxPollMs: Number(process.env["OUTBOX_POLL_MS"] ?? 2000),
  outboxMaxAttempts: Number(process.env["OUTBOX_MAX_ATTEMPTS"] ?? 5),
  outboxRetryBaseMs: Number(process.env["OUTBOX_RETRY_BASE_MS"] ?? 2000),
  outboxRetryMaxMs: Number(process.env["OUTBOX_RETRY_MAX_MS"] ?? 300000),

  // Inventory holds the stock; the till reserves and sells through it
  inventoryApiUrl:
    process.env["INVENTORY_API_URL"] ?? "http://localhost:3002/inventory-api",
  // A cashier is waiting, so give up quickly rather than freeze the till
  inventoryTimeoutMs: Number(process.env["INVENTORY_TIMEOUT_MS"] ?? 3000),

  // The store this service runs in: its location code in Inventory
  storeLocationCode: process.env["STORE_LOCATION_CODE"] ?? "STORE-3",

  // Kenyan VAT. Shelf prices include it, so it is worked out of the total, not added.
  vatRatePercent: Number(process.env["VAT_RATE_PERCENT"] ?? 16),

  featurePos: process.env["FEATURE_POS"] !== "false",
};
