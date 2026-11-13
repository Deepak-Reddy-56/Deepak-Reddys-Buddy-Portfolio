/// <reference types="vite/client" />

/** true only in dev / QA builds (see vite.config.ts). */
declare const __DEBUG__: boolean;

interface ImportMetaEnv {
  readonly VITE_CONTACT_EMAIL?: string;
  readonly VITE_LINKEDIN_URL?: string;
  readonly VITE_INTRO_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
