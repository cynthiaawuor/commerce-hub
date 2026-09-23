// Single place that reads VITE_* variables, so the rest of the app never touches import.meta.env.
export const env = {
  procurementApiUrl: import.meta.env.VITE_PROCUREMENT_API_URL ?? "/procurement-api",
  vendorApiUrl: import.meta.env.VITE_VENDOR_API_URL ?? "/vendor-api",
};
