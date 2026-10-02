/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_INVENTORY_API_URL?: string;
  readonly VITE_FEATURE_INVENTORY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
