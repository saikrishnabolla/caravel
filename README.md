# Caravel

Caravel is an open-source Pi coding agent that turns an existing API into a developer product AI agents can discover, access, pay for, and use.

Give Caravel an OpenAPI document. It prepares one source-backed package containing:

- editable Fumadocs guides;
- an interactive Fumadocs OpenAPI reference;
- TypeScript and Python SDK configuration through Fern;
- API-key or optional x402 access through a Next.js gateway;
- Caravel discovery and an A2A Agent Card;
- editable UI embed briefs generated from the API operations.

The first release focuses on APIs. Wider agent commerce remains the direction, not the current claim.

## Start

Run the Pi agent inside an API repository:

```bash
pnpm caravel
```

Or connect an OpenAPI document directly:

```bash
pnpm caravel connect https://example.com/openapi.json
pnpm caravel configure --upstream https://api.example.com
pnpm caravel build
pnpm caravel install
```

Caravel keeps its source catalog and editable drafts under `.caravel/`. Installed application files are recorded in `.caravel-installed.json`, so `caravel update` and `caravel uninstall` only replace or remove files owned by Caravel.

## Generated developer portal

The installed Fumadocs portal has four sections:

- **Guides**: quickstart, authentication, and endpoint guides grouped by OpenAPI tags.
- **API Reference**: exact parameters, schemas, authentication, code samples, and live request testing through `fumadocs-openapi`.
- **SDKs**: local Fern generation for TypeScript and Python.
- **Embeds**: editable UI component briefs grounded in individual API operations.

The API reference and Fern SDKs target the generated Caravel gateway, not the private upstream API.

## Editorial workflow

The OpenAPI reference remains deterministic. Pi can improve the explanation around it with validated tools:

- `caravel_write_guide` saves an editable endpoint guide.
- `caravel_write_snippet` saves an editable UI embed.

Caravel may infer ordinary use cases from documented behavior, but it must not invent endpoints, parameters, responses, authentication, prices, or guarantees.

## Access

API-key access is enabled by default:

```bash
CARAVEL_API_KEYS=local-development-key pnpm dev
```

Add x402 when a payment address and pricing have been approved:

```bash
pnpm caravel configure \
  --x402-preset monad-testnet \
  --x402-pay-to 0xYOUR_ADDRESS \
  --x402-price 0.01

pnpm caravel build
pnpm caravel update
```

Production credentials are never written into Caravel configuration. Configuration stores environment-variable names only.

## SDKs

Generate the configured TypeScript and Python SDKs locally:

```bash
pnpm caravel generate
```

Fern runs locally and requires Docker or Podman. A hosted Fern account is not required.

## Commands

```bash
caravel setup
caravel connect <openapi-url-or-file>
caravel configure [options]
caravel report
caravel build
caravel generate
caravel install
caravel update
caravel doctor
caravel uninstall
```

## Verified payment

Caravel has completed a real `0.01` test-USDC x402 settlement through a generated gateway on Monad testnet.

[View transaction](https://monadvision.com/tx/0x1e5464ff94cfaff7f49d17dd1e6aed173d19c774d831bcad3ef640262c35bb22)
