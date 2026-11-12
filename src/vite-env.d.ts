/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTACT_EMAIL?: string;
  readonly VITE_LINKEDIN_URL?: string;
  readonly VITE_INTRO_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
