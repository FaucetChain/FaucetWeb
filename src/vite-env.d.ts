/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FAUCET_ADDRESS: string;
  readonly VITE_FAUCET_API: string;
  readonly VITE_AIRDROP_AMOUNT: string;
  readonly VITE_LINKEDIN_URL?: string;
  readonly VITE_INSTAGRAM_URL?: string;
  readonly VITE_FACEBOOK_URL?: string;
  readonly BASE_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
