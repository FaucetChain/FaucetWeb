# FaucetWeb

Static Solana **Devnet** and **Testnet** faucet UI. GitHub Actions builds the site and publishes only the output to GitHub Pages at **[https://faucet.chains.my](https://faucet.chains.my)**.

This repo is **build-only**. There is no server and no faucet private key here. Airdrops are sent by the API at `VITE_FAUCET_API`.

## Local

```bash
npm i
npm run dev
```

```bash
npm run build
npm run preview
```

## Pages

Pushes to `main` run `.github/workflows/pages.yml`: `npm ci` → `npm run build` → deploy `dist/` with `CNAME` `faucet.chains.my`. Public faucet config is in `.env.production`.
