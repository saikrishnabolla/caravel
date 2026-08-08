# Raingentic

An agent-commerce control plane that negotiates agricultural mission-readiness services over the official A2A v1.0 protocol, pauses for human approval, accepts a real Monad Testnet x402 payment, fulfills through a scoped Rain sandbox card, verifies delivery, and simulates Rain USD↔stablecoin treasury routes.

## Run locally

```bash
pnpm install
pnpm dev
```

The application reads Rain sandbox credentials from `.env` or `.env.local`. Both uppercase names and the lowercase names supplied in the hackathon credential file are supported.

When `OPENAI_API_KEY` or `openai_key` is configured, the server uses the official OpenAI Agents SDK to prepare the purchasing plan. Without a key, the same tool boundary runs through a deterministic fallback so the demo remains reliable.

Monad/x402 uses test USDC on Monad Testnet. Rain card and treasury flows use simulated sandbox funds. Rain payment-route simulations are capped at $100 and require the RUSD test token on Base, so the application does not claim a direct Monad-to-bank offramp.

## Checks

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```
