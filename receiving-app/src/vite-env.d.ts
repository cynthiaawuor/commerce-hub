/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RECEIVING_API_URL?: string;
  readonly VITE_FEATURE_RECEIVING?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
