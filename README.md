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

Today, Caravel imports OpenAPI operations, records their source, and reports missing descriptions, prices, commercial rules, and publication work. Fern SDK generation, Fumadocs publishing, x402 payments, and wider agent commerce come next.
