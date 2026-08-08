# Raingentic

A policy-controlled purchasing agent that compares providers, creates a scoped Rain card, demonstrates an invalid payment decline, settles an approved payment, and verifies delivery.

## Run locally

```bash
pnpm install
pnpm dev
```

The application reads Rain sandbox credentials from `.env` or `.env.local`. Both uppercase names and the lowercase names supplied in the hackathon credential file are supported.

## Checks

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```
