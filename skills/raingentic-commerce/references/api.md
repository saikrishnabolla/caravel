# Raingentic API reference

## Discovery

- `GET /api/openapi`: deployment-aware PreFlight OpenAPI 3.1 specification.
- `GET /.well-known/agent-card.json`: official A2A Agent Card.
- `GET /api/platform/status`: configured infrastructure status.

## Catalog import

`POST /api/catalog/import`

```json
{
  "source": "openapi",
  "location": "/api/openapi"
}
```

Supported source values: `openapi`, `commerce`, `website`, `billing`, and `api`.

For public Shopify collections, pass the collection page URL. Raingentic resolves the public `products.json` endpoint and returns products, variants, prices, and availability.

## Policy compilation

`POST /api/policies/compile`

```json
{
  "instructions": "Give approved customers 20% off above 10000 calls. Never sell below $0.02. Require approval above $1000.",
  "product": "Winds Aloft",
  "resource": "GET /api/preflight/weather/winds-aloft",
  "basePrice": 0.03,
  "minimumPrice": 0.02,
  "maximumDiscountPercent": 20,
  "settlement": "Monad x402",
  "currency": "USDC"
}
```

The response uses OpenAI when configured and a conservative deterministic parser otherwise. Application code must enforce the approved result.

## Setup agent

`POST /api/setup/plan` accepts a plain-English business request and the normalized imported catalog. It returns a proposed catalog strategy, pricing strategy, payment-rail assignments, approval rule, and next actions. A person must confirm the proposal before publishing or paying.

## Payment proofs

- `GET /api/x402/mission-readiness`: AP2-authorized paid resource settled with Monad Testnet USDC.
- `POST /api/purchases/run`: complete A2A, AP2, Monad x402, Rain card, and delivery workflow.
- `POST /api/demo/high-ticket`: approval-gated `$28,900` XAG P150 Rain sandbox purchase proof.
- `GET /api/contracts/escrow`: deployed Monad Testnet escrow metadata and the live sample order state for the `$28,900` XAG product.

The optional Solidity escrow records the buyer, merchant, USDC amount, required deposit, expiration, and commercial terms hash. It can hold and release stablecoin funds, refund a funded order, or cancel an unfunded order. Rain remains available for card or invoice settlement.

## Environment

- `OPENAI_API_KEY`
- `MONAD_BUYER_PRIVATE_KEY`
- `MONAD_PROVIDER_ADDRESS`
- Rain sandbox base URL, API key, program ID, and user ID expected by `src/lib/rain.ts`

Use production credentials only after replacing sandbox and testnet configuration and adding customer authentication.
