// Single place that reads VITE_* variables, so the rest of the app never touches import.meta.env.
export const config = {
  financialsApiUrl: import.meta.env.VITE_FINANCIALS_API_URL ?? "/financials-api",
  // Only exactly "true" enables the module, so an unfinished one never appears by accident
  featureFinancials: import.meta.env.VITE_FEATURE_FINANCIALS === "true",
};
