# Raingentic

A policy-controlled purchasing agent that compares providers, pauses for human approval, creates a scoped Rain card, demonstrates an invalid payment decline, settles an approved payment, verifies delivery, and produces a simulated Monad/x402 receipt.

## Run locally

```bash
pnpm install
pnpm dev
```

The application reads Rain sandbox credentials from `.env` or `.env.local`. Both uppercase names and the lowercase names supplied in the hackathon credential file are supported.

When `OPENAI_API_KEY` is configured, the server uses the official OpenAI Agents SDK to prepare the purchasing plan. Without a key, the same tool boundary runs through a deterministic fallback so the demo remains reliable.

Monad/x402 is currently an explicit test simulation. No real USDC is used.

## Checks

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```
