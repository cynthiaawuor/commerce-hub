// Single place that reads VITE_* variables, so the rest of the app never touches import.meta.env.
export const config = {
  receivingApiUrl: import.meta.env.VITE_RECEIVING_API_URL ?? "/receiving-api",
  // Only exactly "true" enables the module, so an unfinished one never appears by accident
  featureReceiving: import.meta.env.VITE_FEATURE_RECEIVING === "true",
};
