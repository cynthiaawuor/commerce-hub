// The broker, and the knobs this service needs. Set per environment; see .env.example.
export const config = {
  rabbitmqUrl:
    process.env["RABBITMQ_URL"] ?? "amqp://guest:guest@localhost:5672",

  consumerMaxRetries: Number(process.env["CONSUMER_MAX_RETRIES"] ?? 3),
  consumerRetryDelayMs: Number(process.env["CONSUMER_RETRY_DELAY_MS"] ?? 10000),

  featureWarehouse: process.env["FEATURE_WAREHOUSE"] !== "false",
};
