---
name: caravel-agentic-commerce
description: Connect an existing API to Caravel, create a source-backed product catalog, and generate agent discovery, Fern SDK config, Fumadocs content, and API-key or x402 access files. Use when an agent needs to inspect an OpenAPI document, prepare an API for AI-agent use, or identify missing descriptions, pricing, and commercial rules.
---

# Caravel Agentic Commerce

Use Caravel to prepare an existing API for AI agents. Do not turn the task into a general buyer-agent, procurement, ecommerce, or physical-product project.

## Workflow

1. Identify the API source. Prefer its OpenAPI document or source code over scraping.
2. Run the bundled connection script with the source URL or local file.
3. Read `.caravel/catalog.json` and `.caravel/report.json`.
4. Report what was imported, where every product came from, and what still requires review.
5. Read existing documentation when the user supplies it. Otherwise draft endpoint guides from the source and mark them for review.
6. Use `caravel_write_guide` for editable guides and `caravel_write_snippet` for requested UI examples.
7. Run `caravel build` after the user chooses access methods.
8. Keep API-key access unless the user asks to remove it. Add x402 only with an approved price, network, and payment address.

## Connect

From the Caravel repository:

```bash
node skills/caravel-agentic-commerce/scripts/caravel.mjs connect <source>
```

Use an explicit connector when automatic detection is insufficient:

```bash
node skills/caravel-agentic-commerce/scripts/caravel.mjs connect <source> --type openapi
```

## Report

```bash
node skills/caravel-agentic-commerce/scripts/caravel.mjs report
```

## Build

```bash
node skills/caravel-agentic-commerce/scripts/caravel.mjs build
node skills/caravel-agentic-commerce/scripts/caravel.mjs build --x402-price 0.01 --x402-pay-to 0x1234
```

Generate SDKs locally without a Fern account:

```bash
cd .caravel/generated/fern
fern generate --group local --local
```

Require Docker or Podman for this step.

Install the generated gateway and docs into a Next.js project:

```bash
node skills/caravel-agentic-commerce/scripts/caravel.mjs install
```

Set `CARAVEL_API_KEYS`. If x402 is enabled, also set `X402_FACILITATOR_URL`.

The installed portal uses Fumadocs for authored guides and `fumadocs-openapi` for interactive endpoint pages. Fumadocs uses Scalar's request client internally. Fern remains the SDK generator. Do not recreate those systems inside Caravel.

Use `caravel doctor` to check the workspace. Use `caravel update` to replace only installed Caravel files. Use `caravel uninstall` to remove the files recorded in `.caravel-installed.json`.

The first release supports OpenAPI. Broader SaaS and commerce connectors remain future agent-commerce work.

## Rules

- Preserve the existing API behavior, authentication, billing, and operational systems.
- Never invent missing operations, parameters, responses, authentication, prices, credentials, or policies.
- Editorial inference is allowed only for plain-language use cases and workflows that follow directly from documented behavior. Mark uncertain claims for review.
- Record source provenance for every imported product.
- Keep commercial configuration as a draft until a person confirms it.
- Review generated files before deploying them.
- Do not claim an SDK, docs site, or paid endpoint is live until it is deployed and tested.
