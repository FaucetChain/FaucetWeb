import { FormEvent, useEffect, useState } from "react";
import ClusterValve from "./ClusterValve";
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
    <main className="tap-shell">
      <header className="tap-header">
        <span className="tap-mark">FaucetChain</span>
        <span className="tap-meta">faucet.block.chains.my</span>
      </header>

      <div className="tap-stage">
        <section>
          <p className="tap-eyebrow">Public cluster tap</p>
          <h1 className="tap-title">
            Draw
            <br />
            test SOL.
          </h1>
          <p className="tap-lede">
            Open the Devnet or Testnet valve, paste a wallet, and take one SOL. It has no value.
            One draw per wallet every 24 hours.
          </p>
          <ClusterValve
            network={network}
            onChange={(next) => {
              setNetwork(next);
              setResult(null);
            }}
          />
          <div className="meter" aria-live="polite">
            <span className="meter-value">{airdropAmount.toFixed(2)}</span>
            <span className="meter-unit">SOL / draw</span>
          </div>
        </section>

        <section className="slip">
          <div className="slip-head">
            <span>Request slip</span>
            <span className="stamp">{network}</span>
          </div>
          <form onSubmit={onSubmit}>
            <label htmlFor="walletAddress">Wallet</label>
            <input
              id="walletAddress"
              value={wallet}
              onChange={(event) => setWallet(event.target.value)}
              onFocus={() => setResult(null)}
              placeholder={`${network} address`}
              autoComplete="off"
              spellCheck={false}
              required
            />
            <button type="submit" disabled={pending || balance?.empty}>
              {pending ? "Opening tap…" : `Draw ${airdropAmount} SOL`}
            </button>
          </form>
          {result && (
            <p className={`note ${result.ok ? "ok" : "bad"}`}>
              {result.message}
              {result.ok && result.explorerUrl && (
                <>
                  {" "}
                  <a href={result.explorerUrl} target="_blank" rel="noopener noreferrer">
                    View on Solscan
                  </a>
                </>
              )}
            </p>
          )}
          <dl className="slip-foot">
            <div>
              <dt>Reservoir</dt>
              <dd>{balance ? (Number.isFinite(Number(balance.sol)) ? `${balance.sol} SOL` : balance.sol) : "…"}</dd>
            </div>
            {faucetAddress && (
              <div>
                <dt>Refill tank</dt>
                <dd>
                  <a
                    href={explorerAddressUrl(network, faucetAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={faucetAddress}
                  >
                    {`${faucetAddress.slice(0, 4)}…${faucetAddress.slice(-4)}`}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </section>
      </div>

      <footer className="tap-footer">
        <span>No mainnet. Test SOL only.</span>
        <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer">
          Official Solana faucet
        </a>
      </footer>
    </main>
  );
}
