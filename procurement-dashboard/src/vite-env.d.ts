/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PROCUREMENT_API_URL?: string;
  readonly VITE_VENDOR_API_URL?: string;
  readonly VITE_FEATURE_PROCUREMENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
