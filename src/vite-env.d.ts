/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'live' = running inside Snowflake SPCS against the Cortex Agent backend; anything else = offline demo. */
  readonly VITE_CHAT_MODE?: 'live' | 'offline' | string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
