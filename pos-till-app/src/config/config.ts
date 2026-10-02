// Single place that reads VITE_* variables, so the rest of the app never touches import.meta.env.
export const config = {
  posApiUrl: import.meta.env.VITE_POS_API_URL ?? "/pos-api",
  // Only exactly "true" enables the module, so an unfinished one never appears by accident
  featurePos: import.meta.env.VITE_FEATURE_POS === "true",
};
