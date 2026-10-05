/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POS_API_URL?: string;
  readonly VITE_FEATURE_POS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
