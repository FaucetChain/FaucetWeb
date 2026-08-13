export type Network = "devnet" | "testnet";

export type AirdropResult = {
  ok: boolean;
  message: string;
  signature?: string;
  explorerUrl?: string;
};

export type FaucetBalance = {
  network: Network;
  sol: string;
  empty: boolean;
};

const LAMPORTS_PER_SOL = 1_000_000_000;
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export const faucetAddress = import.meta.env.VITE_FAUCET_ADDRESS || "";
export const faucetApi = (import.meta.env.VITE_FAUCET_API || "").replace(/\/$/, "");
export const airdropAmount = Number(import.meta.env.VITE_AIRDROP_AMOUNT || 1);

export function isValidAddress(value: string): boolean {
  return BASE58.test(value.trim());
}

export function explorerAddressUrl(network: Network, address: string): string {
  return `https://solscan.io/account/${address}?cluster=${network}`;
}

export function rpcUrl(network: Network): string {
  return network === "devnet"
    ? "https://api.devnet.solana.com"
    : "https://api.testnet.solana.com";
}

export async function getFaucetBalance(network: Network): Promise<FaucetBalance> {
  if (faucetApi) {
    const response = await fetch(`${faucetApi}/api/balance?network=${network}`);
    if (response.ok) {
      const body = (await response.json()) as FaucetBalance & { ok?: boolean };
      if (body.sol) return body;
    }
  }

  if (!faucetAddress) {
    return { network, sol: "not configured", empty: true };
  }

  const response = await fetch(rpcUrl(network), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getBalance",
      params: [faucetAddress],
    }),
  });
  const body = (await response.json()) as { result?: { value: number } };
  const sol = (body.result?.value ?? 0) / LAMPORTS_PER_SOL;
  return { network, sol: sol.toFixed(2), empty: sol < 2 };
}

export async function requestAirdrop(network: Network, walletAddress: string): Promise<AirdropResult> {
  if (!faucetApi) {
    return { ok: false, message: "Faucet API is not configured" };
  }
  const response = await fetch(`${faucetApi}/api/airdrop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ network, walletAddress }),
  });
  const body = (await response.json()) as AirdropResult;
  return body;
}
