/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FINANCIALS_API_URL?: string;
  readonly VITE_FEATURE_FINANCIALS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
