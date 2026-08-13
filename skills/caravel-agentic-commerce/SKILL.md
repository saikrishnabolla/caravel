---
name: caravel-agentic-commerce
description: Connect an existing SaaS product, API, Shopify-compatible store, WooCommerce store, BigCommerce store, billing catalog, or custom product source to Caravel and prepare it for agentic commerce. Use when an agent needs to discover what a business already sells, create a source-backed catalog, produce a readiness report, identify missing pricing or product data, configure commercial rules, or prepare publication for AI-agent discovery and payment.
---

# Caravel Agentic Commerce

Use Caravel to prepare an existing seller for AI agents. Do not turn the task into a general buyer-agent or procurement project.

## Workflow

1. Identify the business source. Prefer a native API or structured catalog over scraping.
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
node skills/caravel-agentic-commerce/scripts/caravel.mjs connect <source> --type shopify
```

## Report

```bash
node skills/caravel-agentic-commerce/scripts/caravel.mjs report
```

The first release supports OpenAPI and public Shopify-compatible catalogs. See [connectors.md](references/connectors.md) before handling WooCommerce, BigCommerce, billing systems, or an unstructured website.

## Rules

- Preserve the existing storefront, checkout, fulfilment, tax, and refund systems.
- Never invent missing products, prices, inventory, or policies.
- Record source provenance for every imported product.
- Keep commercial configuration as a draft until a person confirms it.
- Use a test buyer only to verify publication. Do not present buying as a separate Caravel product.
