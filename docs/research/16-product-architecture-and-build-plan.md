# Raingentic Product Architecture and Build Plan

## Product

Raingentic is an SDK and control layer that adds controlled agent buying and selling to an existing business. It does not replace the business's store, application, developer platform, or payment processor.

PreFlight is the reference company. It sells drone hardware and operational data products while purchasing upstream airspace, weather, mapping, compliance, telemetry, and go-to-market services.

## Demo story

1. A customer agent discovers and purchases a PreFlight mission-readiness product.
2. A2A carries discovery and negotiation.
3. AP2 authorizes the exact product, seller, amount, and payment method.
4. Monad x402 accepts payment for the digital API product.
5. PreFlight purchases required upstream data using a scoped Rain card.
6. Rain blocks an invalid merchant and accepts the approved provider.
7. The app retrieves the transaction and verifies delivery.
8. The transaction can be reversed before settlement or refunded after settlement.
9. Rain payment accounts and routes demonstrate simulated onramp and offramp operations.

## Application structure

### Documentation shell

- Fumadocs navigation and page layout
- Product overview
- PreFlight reference-company explanation and official application link
- Buying guide
- Selling guide
- Treasury and operations guide
- SDK installation guide
- API reference
- Embedded interactive demo components

### Guided demo mode

- One linear presentation path
- Large readable controls
- Prepared default data
- Clear progress and receipts
- No setup screens during the primary demo
- Reliable preview mode
- Explicit labels for sandbox, testnet, and production capabilities

### Existing dashboard

- Preserve the current dashboard as a fallback route
- Do not remove it until the documentation application passes the complete demo rehearsal

## Buying components

### Natural-language mandate

- Accept a business request in plain language
- Extract objective, budget, quantity, quality, geography, vendor, and approval constraints
- Present extracted rules for human confirmation
- Keep deterministic policy code authoritative

### Vendor discovery

- Approved vendor registry
- A2A provider discovery
- x402 provider discovery
- Traditional vendor fallback
- Human approval for newly discovered vendors

### Provider evaluation

- Price
- Data freshness
- Coverage
- Quality
- Reputation evidence
- Payment compatibility
- Existing approval status
- Small sample purchase support
- Provider comparison and ranking

### Payment routing

- Monad x402 for paid APIs
- Rain scoped cards for traditional merchants
- Rain payment routes for supported money movement
- Human approval for configured thresholds
- AP2 authorization before payment

### Upstream procurement example

- Airspace authorization processing through an approved provider
- Weather and airspace data
- Mapping and compliance data
- Telemetry services
- Go-to-market data services

### Transaction lifecycle

- Create scoped card
- Simulate invalid authorization
- Simulate valid authorization
- Settle authorization
- Fetch final transaction
- Reverse authorization
- Refund settled transaction
- Display receipt and audit history

### Treasury

- Fetch payment accounts
- Fetch individual payment account
- Delete payment account
- Fetch payment routes
- Fetch individual payment route
- Create payment route
- Update payment route
- Delete payment route
- Simulate onramp
- Simulate offramp
- Simulate collateral funding

### Optional treasury recommendation

- Identify idle funds
- Prepare an allocation recommendation
- Require human approval
- Do not execute regulated investments in the hackathon demo

## Selling components

### Catalog

- Drone hardware products
- Mission-readiness API
- Weather data
- Airspace analysis
- Risk assessment
- Telemetry processing
- Mapping information
- Compliance reports
- Airspace authorization processing

### API onboarding

- Accept an OpenAPI URL or document
- Generate a product definition
- Generate an A2A Agent Card skill
- Configure an x402-protected route
- Configure AP2 authorization constraints
- Configure Monad settlement
- Generate integration documentation

### Pricing controls

- Starting price
- Minimum price
- Price per call
- Volume discounts
- Product bundles
- Customer eligibility
- Maximum negotiated discount
- Payment methods
- Refund rules
- Fulfillment requirements

### Agent selling

- A2A discovery
- Structured negotiation
- Deterministic pricing enforcement
- AP2 authorization
- x402 payment
- Digital delivery
- Receipt

### Traditional selling

- Preserve the existing ecommerce checkout
- Support an existing card processor for customer card acceptance
- Add stablecoin and agent-payment choices beside the existing checkout
- Support refund and fulfillment evidence

## Shared platform components

### Policy engine

- Budgets
- Vendors
- Products
- Discounts
- Payment methods
- Approval thresholds
- Counterparties
- Frequency and timing
- Expiration
- Refunds
- Delivery verification

### Audit record

- Business request
- Agent plan
- Provider discovery
- Negotiation
- Human approval
- AP2 authorization
- Payment
- Upstream procurement
- Delivery
- Reversal or refund

### Protocol adapters

- OpenAI Agents SDK
- A2A
- AP2
- x402
- Monad
- Rain

### SDK direction

The intended integration is a small package that connects the business's existing catalog, checkout, treasury, and policies to the protocol adapters. The hackathon implementation proves the public interface through working application routes before packaging it as a published SDK.

## Build order

1. Preserve the existing dashboard.
2. Add the Fumadocs shell and navigation.
3. Add the overview and PreFlight reference pages.
4. Add the guided demo page.
5. Complete the Rain transaction lifecycle.
6. Complete payment-route and payment-account lifecycle operations.
7. Build the buying demonstration.
8. Build the selling demonstration.
9. Connect the shared audit receipt.
10. Add SDK documentation and integration snippets.
11. Complete responsive, production-build, and demo rehearsal checks.
