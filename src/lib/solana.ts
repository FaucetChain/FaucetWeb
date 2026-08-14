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

function parseApiBalance(
  network: Network,
  body: { sol?: string; amount?: string; empty?: boolean },
): FaucetBalance | null {
  const raw = body.sol ?? body.amount;
  if (raw == null || raw === "") return null;
  const sol = String(raw);
  const numeric = Number(sol);
  return {
    network,
    sol,
    empty: Boolean(body.empty ?? (Number.isFinite(numeric) && numeric < airdropAmount)),
  };
}

export async function getFaucetBalance(network: Network): Promise<FaucetBalance> {
  if (faucetApi) {
    try {
      const response = await fetch(`${faucetApi}/api/balance?network=${network}`);
      if (response.ok) {
        const parsed = parseApiBalance(
          network,
          (await response.json()) as { sol?: string; amount?: string; empty?: boolean },
        );
        if (parsed) return parsed;
      }
    } catch {
      // Fall through to public RPC.
    }
  }

  if (!faucetAddress) {
    return { network, sol: "not configured", empty: true };
  }

  try {
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
    return { network, sol: sol.toFixed(2), empty: sol < airdropAmount };
  } catch {
    return { network, sol: "unavailable", empty: true };
  }
}

export async function requestAirdrop(
  network: Network,
  walletAddress: string,
  honeypot = "",
  lead = "",
): Promise<AirdropResult> {
  if (!faucetApi) {
    return { ok: false, message: "Faucet API is not configured" };
  }
  try {
    const response = await fetch(`${faucetApi}/api/airdrop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ network, walletAddress, company_url: honeypot, lead }),
    });
    const body = (await response.json()) as AirdropResult;
    if (body?.message) return body;
    return { ok: false, message: `Airdrop failed (${response.status})` };
  } catch {
    return { ok: false, message: "Could not reach the faucet API." };
  }
}
