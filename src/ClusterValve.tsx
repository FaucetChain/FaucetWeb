import type { Network } from "./lib/solana";

const PORTS: { id: Network; label: string; meta: string }[] = [
  { id: "devnet", label: "Devnet", meta: "Solana" },
  { id: "testnet", label: "Testnet", meta: "Solana" },
];

export default function ClusterValve({
  network,
  onChange,
}: {
  network: Network;
  onChange: (network: Network) => void;
}) {
  return (
    <div className="lanes" role="radiogroup" aria-label="Solana cluster">
      {PORTS.map((port) => (
        <button
          key={port.id}
          type="button"
          role="radio"
          className="lane"
          aria-checked={network === port.id}
          onClick={() => onChange(port.id)}
        >
          <span className="lane-name">{port.label}</span>
          <span className="lane-meta">{port.meta}</span>
        </button>
      ))}
    </div>
  );
}
