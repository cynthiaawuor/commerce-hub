// Where the other services live, and how long we wait for them.
// Set per environment; see .env.example.
export const config = {
  vendorApiUrl:
    process.env["VENDOR_API_URL"] ?? "http://localhost:3000/vendor-api",
  vendorTimeoutMs: Number(process.env["VENDOR_TIMEOUT_MS"] ?? 5000),
  rabbitmqUrl:
    process.env["RABBITMQ_URL"] ?? "amqp://guest:guest@localhost:5672",

  outboxPollMs: Number(process.env["OUTBOX_POLL_MS"] ?? 2000),
  outboxMaxAttempts: Number(process.env["OUTBOX_MAX_ATTEMPTS"] ?? 5),

  outboxRetryBaseMs: Number(process.env["OUTBOX_RETRY_BASE_MS"] ?? 2000),
  outboxRetryMaxMs: Number(process.env["OUTBOX_RETRY_MAX_MS"] ?? 300000),

  // A consumed message that fails is retried this many times before it is dead-lettered
  consumerMaxRetries: Number(process.env["CONSUMER_MAX_RETRIES"] ?? 3),
  consumerRetryDelayMs: Number(process.env["CONSUMER_RETRY_DELAY_MS"] ?? 10000),

  featureProcurement: process.env["FEATURE_PROCUREMENT"] !== "false",
};
