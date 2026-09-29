/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WAREHOUSE_API_URL?: string;
  readonly VITE_FEATURE_WAREHOUSE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
