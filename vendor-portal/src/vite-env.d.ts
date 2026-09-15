/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VENDOR_API_URL?: string;
  readonly VITE_FEATURE_VENDOR_MANAGEMENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
