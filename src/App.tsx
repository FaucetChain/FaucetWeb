import { FormEvent, useEffect, useMemo, useState } from "react";
import ClusterValve from "./ClusterValve";
import {
  airdropAmount,
  explorerAddressUrl,
  faucetAddress,
  faucetApi,
  getFaucetBalance,
  isValidAddress,
  requestAirdrop,
  type AirdropResult,
  type FaucetBalance,
  type Network,
} from "./lib/solana";

type LeadConfig = {
  required: boolean;
  telegram: { enabled: boolean; url: string };
  discord: { enabled: boolean; url: string };
  socials: {
    telegram?: string;
    discord?: string;
    linkedin?: string;
    instagram?: string;
    facebook?: string;
  };
};

const LEAD_KEY = "faucet.lead";

function takeLeadFromUrl(): string {
  const params = new URLSearchParams(window.location.search);
  const lead = params.get("lead");
  if (lead) {
    sessionStorage.setItem(LEAD_KEY, lead);
    params.delete("lead");
    const search = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${search ? `?${search}` : ""}`);
  }
  return sessionStorage.getItem(LEAD_KEY) || "";
}

function leadCaption(token: string): string {
  try {
    const body = token.split(".")[0] || "";
    const padded = body.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (body.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { provider?: string; username?: string };
    const network = payload.provider === "telegram" ? "Telegram" : "Discord";
    return payload.username ? `${network} · ${payload.username}` : network;
  } catch {
    return "Verified";
  }
}

export default function App() {
  const [network, setNetwork] = useState<Network>("devnet");
  const [wallet, setWallet] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [lead, setLead] = useState("");
  const [config, setConfig] = useState<LeadConfig | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<AirdropResult | null>(null);
  const [balance, setBalance] = useState<FaucetBalance | null>(null);

  useEffect(() => {
    setLead(takeLeadFromUrl());
    if (!faucetApi) return;
    const next = encodeURIComponent(`${window.location.origin}${window.location.pathname}`);
    fetch(`${faucetApi}/api/auth/config?next=${next}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((body: LeadConfig | null) => {
        if (body) setConfig(body);
      })
      .catch(() => undefined);
  }, []);

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
      setResult({ ok: false, message: "That is not a Solana address." });
      return;
    }
    if (config?.required && !lead) {
      setResult({ ok: false, message: "Verify with Telegram or Discord first." });
      return;
    }
    setPending(true);
    setResult(null);
    try {
      setResult(await requestAirdrop(network, address, honeypot, lead));
    } catch {
      setResult({ ok: false, message: "Airdrop failed. Try again." });
    } finally {
      setPending(false);
    }
  };

  const tank = balance
    ? Number.isFinite(Number(balance.sol))
      ? `${balance.sol} SOL`
      : balance.sol
    : "…";
  const empty = Boolean(balance?.empty);
  const needsLead = Boolean(config?.required && !lead);
  const action = empty
    ? "Empty"
    : pending
      ? "Sending"
      : needsLead
        ? "Verify first"
        : `Send ${airdropAmount} SOL`;

  const socials = useMemo(() => {
    const fromConfig = config?.socials || {};
    return {
      telegram: fromConfig.telegram || "",
      discord: fromConfig.discord || "",
      linkedin: import.meta.env.VITE_LINKEDIN_URL || fromConfig.linkedin || "",
      instagram: import.meta.env.VITE_INSTAGRAM_URL || fromConfig.instagram || "",
      facebook: import.meta.env.VITE_FACEBOOK_URL || fromConfig.facebook || "",
    };
  }, [config]);

  return (
    <main className="well" data-network={network}>
      <div className="sky">
        <header className="brand">
          <span className="mark">FaucetChain</span>
          <span className="host">faucet.chains.my</span>
        </header>
        <div className="lede">
          <p className="lede-kicker">Testnet only</p>
          <h1>Test SOL, as needed.</h1>
          <p>
            A small amount for building. Verify with Telegram or Discord, then paste a wallet. Once
            every 24 hours. It has no value.
          </p>
        </div>
      </div>

      <div className="waterline" aria-hidden="true" />

      <div className="basin">
        <div className="stage">
          <section>
            <p className="draw">
              {Number.isInteger(airdropAmount) ? airdropAmount : airdropAmount.toFixed(2)}
              <small>SOL</small>
            </p>
            <ClusterValve
              network={network}
              onChange={(next) => {
                setNetwork(next);
                setResult(null);
              }}
            />
            <dl className="levels">
              <div>
                <dt>Remaining</dt>
                <dd>{balance ? tank : "checking"}</dd>
              </div>
              <div>
                <dt>Limit</dt>
                <dd>once / 24h</dd>
              </div>
              {faucetAddress && (
                <div>
                  <dt>Refill</dt>
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

          <section className="dock">
            <p className="dock-kicker">{network} request</p>
            {(config?.telegram.enabled || config?.discord.enabled) && (
              <div className="socials">
                {config?.telegram.enabled && (
                  <a className="social" href={config.telegram.url} target="_blank" rel="noopener noreferrer">
                    Telegram
                  </a>
                )}
                {config?.discord.enabled && (
                  <a className="social" href={config.discord.url}>
                    Discord
                  </a>
                )}
              </div>
            )}
            {lead ? <p className="lead-ok">{leadCaption(lead)}</p> : null}
            <form onSubmit={onSubmit}>
              <label htmlFor="walletAddress">Wallet</label>
              <input
                id="company_url"
                className="hp"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={honeypot}
                onChange={(event) => setHoneypot(event.target.value)}
              />
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
              <button type="submit" disabled={pending || empty || needsLead}>
                {action}
              </button>
            </form>
            {result && (
              <p className={`note ${result.ok ? "ok" : "bad"}`} role="status">
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
          </section>
        </div>
      </div>

      <footer className="keel">
        <span>No mainnet. Test SOL only.</span>
        <span className="keel-links">
          {socials.telegram && (
            <a href={socials.telegram} target="_blank" rel="noopener noreferrer">
              Telegram
            </a>
          )}
          {socials.discord && (
            <a href={socials.discord} target="_blank" rel="noopener noreferrer">
              Discord
            </a>
          )}
          {socials.linkedin && (
            <a href={socials.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          )}
          {socials.instagram && (
            <a href={socials.instagram} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          )}
          {socials.facebook && (
            <a href={socials.facebook} target="_blank" rel="noopener noreferrer">
              Facebook
            </a>
          )}
          <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer">
            Official Solana faucet
          </a>
        </span>
      </footer>
    </main>
  );
}
