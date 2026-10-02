// The broker, Inventory, and the knobs this service needs. Set per environment;
// see .env.example.
export const config = {
  rabbitmqUrl:
    process.env["RABBITMQ_URL"] ?? "amqp://guest:guest@localhost:5672",

  consumerMaxRetries: Number(process.env["CONSUMER_MAX_RETRIES"] ?? 3),
  consumerRetryDelayMs: Number(process.env["CONSUMER_RETRY_DELAY_MS"] ?? 10000),

  // Inventory is asked what each product sold cost
  inventoryApiUrl:
    process.env["INVENTORY_API_URL"] ?? "http://localhost:3002/inventory-api",
  inventoryTimeoutMs: Number(process.env["INVENTORY_TIMEOUT_MS"] ?? 3000),
  // How often sales still waiting for their cost are tried again
  costingPollMs: Number(process.env["COSTING_POLL_MS"] ?? 60000),

  featureFinancials: process.env["FEATURE_FINANCIALS"] !== "false",
};
