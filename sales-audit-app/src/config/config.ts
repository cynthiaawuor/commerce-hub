// Single place that reads VITE_* variables, so the rest of the app never touches import.meta.env.
export const config = {
  salesAuditApiUrl: import.meta.env.VITE_SALES_AUDIT_API_URL ?? "/sales-audit-api",
  // Only exactly "true" enables the module, so an unfinished one never appears by accident
  featureSalesAudit: import.meta.env.VITE_FEATURE_SALES_AUDIT === "true",
};
