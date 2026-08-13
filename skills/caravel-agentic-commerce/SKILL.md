---
name: caravel-agentic-commerce
description: Connect an existing API to Caravel and prepare a source-backed product catalog and readiness report. Use when an agent needs to inspect an OpenAPI document, identify callable operations, preserve provenance, or find missing descriptions, pricing, commercial rules, and publication work before AI-agent discovery and payment are configured.
---

# Caravel Agentic Commerce

Use Caravel to prepare an existing API for AI agents. Do not turn the task into a general buyer-agent, procurement, ecommerce, or physical-product project.

## Workflow

1. Identify the API source. Prefer its OpenAPI document or source code over scraping.
2. Run the bundled connection script with the source URL or local file.
3. Read `.caravel/catalog.json` and `.caravel/report.json`.
4. Report what was imported, where every product came from, and what still requires review.
5. Ask before changing prices, negotiation limits, payment routes, or publishing anything.
6. Treat website extraction as unverified input until the user reviews it.

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

The first release supports OpenAPI. Broader SaaS and commerce connectors remain future agent-commerce work.

## Rules

- Preserve the existing API behavior, authentication, billing, and operational systems.
- Never invent missing operations, descriptions, prices, credentials, or policies.
- Record source provenance for every imported product.
- Keep commercial configuration as a draft until a person confirms it.
- Do not claim Fern, Fumadocs, x402, or publication is working until it is implemented and verified in the current repository.
