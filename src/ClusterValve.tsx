import type { Network } from "./lib/solana";

const PORTS: { id: Network; label: string }[] = [
  { id: "devnet", label: "Devnet" },
  { id: "testnet", label: "Testnet" },
];

export default function ClusterValve({
  network,
  onChange,
}: {
  network: Network;
  onChange: (network: Network) => void;
}) {
  return (
    <div className="valve" role="radiogroup" aria-label="Solana cluster">
      <div className="valve-manifold">
        {PORTS.map((port) => (
          <button
            key={port.id}
            type="button"
            role="radio"
            className="valve-port"
            aria-checked={network === port.id}
            onClick={() => onChange(port.id)}
          >
            <span className="valve-flange">
              <span className="valve-water" />
              <span className="valve-drip" />
            </span>
            {port.label}
          </button>
        ))}
      </div>
    </div>
  );
}
