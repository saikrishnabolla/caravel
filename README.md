# Caravel

Turn the products and services you already sell into agentic commerce.

Caravel connects to an existing SaaS product, API, or online store, including platforms such as Shopify, WooCommerce, and BigCommerce. It makes the existing catalog discoverable, negotiable, and payable by AI agents without requiring the business to rebuild its product or checkout.

OpenAPI is one supported input for software products. It is not the product itself.

## First working CLI slice

Connect an API or Shopify-compatible store:

```bash
pnpm caravel connect https://preflight.saibolla.com/openapi.json
pnpm caravel connect https://store.example.com --type shopify
```

Caravel creates a local `.caravel` workspace containing:

- `catalog.json`: normalized products with source provenance
- `report.json`: missing descriptions, prices, availability, policy, and publication work
- `config.json`: the draft business connection and publication state

Read the report again with:

```bash
pnpm caravel report
```

The first slice supports OpenAPI and public Shopify-compatible catalogs. Additional SaaS, ecommerce, billing, configuration, publication, and verification workflows will use the same catalog and report contracts.
