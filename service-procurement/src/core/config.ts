// Where the other services live, and how long we wait for them.
// Set per environment; see .env.example.
export const config = {
  vendorApiUrl:
    process.env["VENDOR_API_URL"] ?? "http://localhost:3000/vendor-api",
  // A buyer is waiting on the response, so fail fast rather than hang
  vendorTimeoutMs: Number(process.env["VENDOR_TIMEOUT_MS"] ?? 5000),
  rabbitmqUrl: process.env["RABBITMQ_URL"] ?? "amqp://guest:guest@localhost:5672",
  // How often the outbox worker looks for events waiting to be published
  outboxPollMs: Number(process.env["OUTBOX_POLL_MS"] ?? 2000),
  // Phase flag for this module. Anything other than "false" leaves it on, so a missing
  // variable in development does not silently disable the service.
  featureProcurement: process.env["FEATURE_PROCUREMENT"] !== "false",
};
