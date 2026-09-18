// Where the other services live, and how long we wait for them.
// Set per environment; see .env.example.
export const config = {
  vendorApiUrl:
    process.env["VENDOR_API_URL"] ?? "http://localhost:3000/vendor-api",
  // A buyer is waiting on the response, so fail fast rather than hang
  vendorTimeoutMs: Number(process.env["VENDOR_TIMEOUT_MS"] ?? 5000),
};
