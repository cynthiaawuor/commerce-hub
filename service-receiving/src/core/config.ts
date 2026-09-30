// The broker, and the knobs this service needs. Set per environment; see .env.example.
export const config = {
  rabbitmqUrl:
    process.env["RABBITMQ_URL"] ?? "amqp://guest:guest@localhost:5672",

  outboxPollMs: Number(process.env["OUTBOX_POLL_MS"] ?? 2000),
  outboxMaxAttempts: Number(process.env["OUTBOX_MAX_ATTEMPTS"] ?? 5),
  outboxRetryBaseMs: Number(process.env["OUTBOX_RETRY_BASE_MS"] ?? 2000),
  outboxRetryMaxMs: Number(process.env["OUTBOX_RETRY_MAX_MS"] ?? 300000),

  consumerMaxRetries: Number(process.env["CONSUMER_MAX_RETRIES"] ?? 3),
  consumerRetryDelayMs: Number(process.env["CONSUMER_RETRY_DELAY_MS"] ?? 10000),

  // Where a delivery is taken in when the clerk does not say
  defaultLocationCode: process.env["DEFAULT_LOCATION_CODE"] ?? "WH-MAIN",

  featureReceiving: process.env["FEATURE_RECEIVING"] !== "false",
};
