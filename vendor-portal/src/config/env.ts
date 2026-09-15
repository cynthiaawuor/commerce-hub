// Single place that reads VITE_* variables, so the rest of the app never touches import.meta.env.
export const env = {
  vendorApiUrl: import.meta.env.VITE_VENDOR_API_URL ?? "/vendor-api",
};
