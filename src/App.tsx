import { FormEvent, useEffect, useState } from "react";
import {
  airdropAmount,
  explorerAddressUrl,
  faucetAddress,
  getFaucetBalance,
  isValidAddress,
  requestAirdrop,
  type AirdropResult,
  type FaucetBalance,
  type Network,
} from "./lib/solana";

const NETWORKS: { id: Network; label: string }[] = [
  { id: "devnet", label: "Devnet" },
  { id: "testnet", label: "Testnet" },
];

export default function App() {
  const [network, setNetwork] = useState<Network>("devnet");
  const [wallet, setWallet] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<AirdropResult | null>(null);
  const [balance, setBalance] = useState<FaucetBalance | null>(null);

  useEffect(() => {
    let cancelled = false;
    getFaucetBalance(network)
      .then((next) => {
        if (!cancelled) setBalance(next);
      })
      .catch(() => {
        if (!cancelled) setBalance({ network, sol: "unavailable", empty: true });
      });
    return () => {
      cancelled = true;
    };
  }, [network, result]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const address = wallet.trim();
    if (!isValidAddress(address)) {
      setResult({ ok: false, message: "Invalid Solana wallet address" });
      return;
    }
    setPending(true);
    setResult(null);
    try {
      setResult(await requestAirdrop(network, address));
    } catch {
      setResult({ ok: false, message: "Airdrop failed" });
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-lg flex-col justify-between">
        <header className="mb-10 flex items-baseline justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
              faucetchain.github.io
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Solana Faucet</h1>
          </div>
          <a
            href="https://github.com/FaucetChain/FaucetWeb"
            className="text-sm text-muted hover:text-foreground"
          >
            GitHub
          </a>
        </header>

        <section className="rounded-xl border border-line bg-card p-6">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-background p-1">
            {NETWORKS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setNetwork(item.id);
                  setResult(null);
                }}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  network === item.id ? "bg-card text-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <p className="mt-6 text-sm text-muted">
            Request {airdropAmount} SOL on Solana {network}. One drop per wallet every 24 hours.
          </p>

          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <input
              value={wallet}
              onChange={(event) => setWallet(event.target.value)}
              onFocus={() => setResult(null)}
              placeholder={`${network} wallet address`}
              autoComplete="off"
              spellCheck={false}
              required
              className="h-11 w-full rounded-md border border-line bg-transparent px-3 font-mono text-sm outline-none ring-accent focus:ring-1"
            />
            <button
              type="submit"
              disabled={pending || balance?.empty}
              className="h-11 w-full rounded-md bg-accent text-sm font-medium text-background disabled:opacity-50"
            >
              {pending ? "Sending…" : `Airdrop ${airdropAmount} SOL`}
            </button>
          </form>

          {result && (
            <p className={`mt-4 text-sm ${result.ok ? "text-accent" : "text-danger"}`}>
              {result.message}
              {result.ok && result.explorerUrl && (
                <>
                  {" "}
                  <a
                    href={result.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                  >
                    View transaction
                  </a>
                </>
              )}
            </p>
          )}

          <dl className="mt-6 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Faucet balance</dt>
              <dd className="font-mono">{balance ? `${balance.sol} SOL` : "…"}</dd>
            </div>
            {faucetAddress && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Donate {network} SOL</dt>
                <dd className="truncate font-mono">
                  <a
                    href={explorerAddressUrl(network, faucetAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                    title={faucetAddress}
                  >
                    {`${faucetAddress.slice(0, 4)}…${faucetAddress.slice(-4)}`}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </section>

        <footer className="mt-10 text-center text-xs text-muted">
          Static GitHub Pages build. Devnet and testnet SOL have no value.
        </footer>
      </div>
    </main>
  );
}
