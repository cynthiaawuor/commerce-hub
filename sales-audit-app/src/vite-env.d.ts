/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SALES_AUDIT_API_URL?: string;
  readonly VITE_FEATURE_SALES_AUDIT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
