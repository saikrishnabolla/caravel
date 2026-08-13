# Caravel

Caravel is an open-source Pi-based coding agent that turns existing APIs into products AI agents can discover, pay for, and use.

The first release focuses on APIs. Broader agent commerce is the direction, not the current claim.

Run Caravel in an API repository:

```bash
pnpm caravel
```

This launches the branded Pi coding agent with Caravel's system prompt, skill, and deterministic catalog tools.

## First working CLI slice

Connect an API directly:

```bash
pnpm caravel connect https://preflight.saibolla.com/openapi.json
```

Caravel creates a local `.caravel` workspace containing:

- `catalog.json`: normalized products with source provenance
- `report.json`: missing descriptions, prices, availability, policy, and publication work
- `config.json`: the draft business connection and publication state

Read the report again with:

```bash
pnpm caravel report
```

Build the product files with:

```bash
pnpm caravel build
pnpm caravel build --x402-price 0.01 --x402-pay-to 0x1234
```

Caravel writes agent discovery, Fern SDK config, Fumadocs content, and a Next.js access wrapper. Existing API keys remain valid. x402 is optional.

Generate SDKs locally without a Fern account:

```bash
cd .caravel/generated/fern
fern generate --group local --local
```

This requires Docker or Podman.

Or run:

```bash
pnpm caravel generate
pnpm caravel install
```

The installer adds the agent discovery file, Fumadocs content, and a Next.js gateway under `/api/caravel`. The gateway keeps the upstream API unchanged and accepts an existing API key or x402 payment.
