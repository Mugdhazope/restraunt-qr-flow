/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_TOKEN?: string;
  /** Dev only: skip WhatsApp OTP; use fixed code on verify screen. */
  readonly VITE_SIMULATE_OTP?: string;
  /**
   * Absolute public SPA origin for QR codes (no trailing slash), e.g. https://menu.example.com.
   * Set at build time for production so QRs never encode localhost.
   */
  readonly VITE_PUBLIC_APP_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
