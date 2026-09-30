// Single place that reads VITE_* variables, so the rest of the app never touches import.meta.env.
export const env = {
  inventoryApiUrl: import.meta.env.VITE_INVENTORY_API_URL ?? "/inventory-api",
};
