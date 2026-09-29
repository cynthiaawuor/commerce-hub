// Single place that reads VITE_* variables, so the rest of the app never touches import.meta.env.
export const config = {
  warehouseApiUrl: import.meta.env.VITE_WAREHOUSE_API_URL ?? "/warehouse-api",
  // Only exactly "true" enables the module, so an unfinished one never appears by accident
  featureWarehouse: import.meta.env.VITE_FEATURE_WAREHOUSE === "true",
};
