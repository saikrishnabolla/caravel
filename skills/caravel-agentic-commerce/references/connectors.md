# Connector guidance

## Structured sources

- OpenAPI: import operations, descriptions, methods, paths, and explicit pricing extensions.
- Shopify: prefer an authenticated Admin API integration; public `products.json` is acceptable for a read-only first pass.
- WooCommerce: use the REST API and request credentials only when private catalog fields are required.
- BigCommerce: use the Catalog API.
- Stripe or Paddle: import products and prices, but preserve the billing platform as the payment and subscription source of truth.

## Websites

Use extraction only when no structured interface exists. Label extracted content as unverified. Require review before using extracted prices, inventory, checkout behavior, or commercial policies.

## Connector output

Every product must include:

- stable source identifier
- name and product kind
- source location and connector
- description when available
- price and currency when available
- variants and availability when available

Missing fields must remain missing and appear in the readiness report.
