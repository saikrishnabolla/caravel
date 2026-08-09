---
name: raingentic-commerce
description: Connect an existing API, Shopify-compatible store, public product catalog, billing system, or custom commerce source to Raingentic; import and normalize products; compile natural-language selling rules; publish agent-ready products; and verify A2A, AP2, Monad x402, and Rain payment flows. Use when an agent needs to onboard a business catalog, monetize OpenAPI operations, configure agent negotiation policy, test live commerce endpoints, or prepare a Raingentic demo.
---

# Raingentic Commerce

Use the running Raingentic deployment as the control plane. Default to `http://localhost:3021` during local development and use `RAINGENTIC_BASE_URL` when supplied.

## Workflow

1. Check `GET /api/platform/status` and report which Rain, Monad, A2A, and AP2 capabilities are configured.
2. Identify the catalog source:
   - OpenAPI: use the document URL.
   - Shopify-compatible store: use the public store or collection URL.
   - Custom platform: use its catalog API, plugin, CSV, or reviewed website URL.
3. Import through `POST /api/catalog/import`. Never fabricate products when the source responds successfully.
4. Review imported products, variants, availability, API methods, paths, and source prices.
5. Compile selling instructions through `POST /api/policies/compile`. Treat the returned structured policy as a draft until a person confirms it.
6. Publish selected products through `POST /api/catalog`.
7. Match the payment rail to the product:
   - API or small data purchase: AP2 authorization plus Monad x402.
   - High-value physical product or traditional vendor: AP2 authorization plus a scoped Rain card.
   - High-value purchase needing deposits or escrow: record the approved terms in the deployed Monad contract, then use its USDC escrow alone or combine it with Rain settlement.
   - Existing merchant checkout: retain the merchant's fulfillment and order system.
8. Run the relevant payment proof only after the user or demo operator approves the exact product and maximum amount.

## Commands

Import a catalog:

```bash
node skills/raingentic-commerce/scripts/import-catalog.mjs "$RAINGENTIC_BASE_URL" openapi "$OPENAPI_URL"
node skills/raingentic-commerce/scripts/import-catalog.mjs "$RAINGENTIC_BASE_URL" commerce "https://raptordynamic.com/collections/xag-drones"
```

Test the hosted OpenAPI specification and every callable demo operation:

```bash
node skills/raingentic-commerce/scripts/test-live-api.mjs "$RAINGENTIC_BASE_URL"
```

Read [references/api.md](references/api.md) for request bodies, payment endpoints, and required environment variables.

## Safety

- Keep credentials server-side.
- Do not submit a real store order during the demo.
- Do not execute Rain or Monad payment calls without explicit approval for the exact amount.
- Preserve the external store or billing platform as the source of truth for inventory, tax, fulfillment, and refunds.
- Label Rain sandbox and Monad Testnet receipts accurately.
