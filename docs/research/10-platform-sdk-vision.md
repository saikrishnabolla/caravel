# Platform and SDK Vision

## Product vision

Build a universal commerce layer that lets AI agents discover, evaluate, purchase, verify, and settle products or services across the internet.

> One integration for platforms building purchasing agents, and one integration for providers that want to sell to those agents.

## Platform architecture

```text
Agent or agent platform
        │
        ▼
Buyer SDK / MCP server / Agent Skill
- purchasing mandate
- budgets and permissions
- vendor comparison
- approval and verification
        │
        ▼
Payment router
- x402/MPP for small machine payments
- cards for ordinary internet checkout
- stablecoin transfer for larger B2B payments
- onramps/offramps for local currencies
        │
        ▼
Provider SDK
- publish offering and price
- accept agent requests
- receive payment
- prove delivery
- reconcile and withdraw funds
```

## Buyer-side SDK

Platforms building agents could install a TypeScript SDK, MCP server, or agent skill that exposes tools such as:

```text
commerce.search_offers
commerce.request_quote
commerce.create_mandate
commerce.evaluate_purchase
commerce.authorize
commerce.pay
commerce.verify_delivery
commerce.request_refund
commerce.get_receipt
```

The agent platform would not need to integrate cards, wallets, x402, stablecoins, vendor evaluation, delivery verification, and receipts independently.

Example:

```typescript
await commerce.buy({
  objective: "Get 1,000 verified finance leads",
  budget: {
    maximum: 750,
    currency: "USD"
  },
  requirements: {
    validEmailRate: 0.90,
    maximumPricePerLead: 0.45
  }
});
```

The platform converts this request into a structured mandate, identifies eligible providers, selects a payment rail, executes the purchase, and verifies the result.

## Payment router

| Purchase | Likely payment rail |
|---|---|
| $0.01 API request | Monad x402/MPP |
| $10 research report | x402, stablecoin, or card |
| $300 SaaS subscription | Rain virtual card |
| $5,000 vendor invoice | Stablecoin or bank transfer through Rain |
| International contractor payment | Rain stablecoin payout and offramp |
| Merchant that accepts only Visa | Rain card |
| Machine-native provider | Monad x402/MPP |

The router considers:

- transaction amount;
- merchant capabilities;
- destination country and currency;
- fees and settlement time;
- refund and dispute protections;
- company purchasing policy;
- compliance and privacy requirements;
- whether delivery can be verified automatically.

Cards are appropriate for many conventional internet purchases. Larger B2B transactions may be better handled through bank or stablecoin transfers rather than cards.

## Provider-side SDK

A data vendor, API provider, freelancer platform, or SaaS company could integrate once and become purchasable by agents.

Example machine-readable offer:

```json
{
  "product": "verified-contact-enrichment",
  "price": {
    "amount": 0.35,
    "currency": "USD",
    "unit": "valid_contact"
  },
  "minimumOrder": 100,
  "delivery": "api",
  "qualityGuarantee": {
    "validEmailRate": 0.90
  },
  "paymentMethods": ["x402", "stablecoin", "card"]
}
```

The provider integration could handle:

- agent-readable product discovery;
- quotes and negotiated terms;
- payment requirements;
- stablecoin acceptance;
- delivery evidence;
- refunds and disputes;
- settlement reconciliation;
- stablecoin or fiat withdrawal.

## Two-sided value

### Agent platforms

- One purchasing interface across multiple payment rails.
- Business mandates instead of only wallet or card limits.
- Vendor comparison, approval, delivery verification, and receipts.
- Less payments, compliance, and reconciliation infrastructure to build internally.

### Providers

- One integration to become discoverable and purchasable by agents.
- Support for pay-per-call, card, stablecoin, and larger invoice payments.
- Consistent quotes, terms, delivery proofs, and transaction records.
- Settlement into supported stablecoin or fiat destinations.

## Responsibility by layer

| Layer | Responsibility |
|---|---|
| Rain | Wallets, scoped cards, authorization controls, transfers, virtual accounts, onramps, offramps, and cross-border money movement |
| Monad | x402/MPP machine payments, programmable settlement, and shared transaction evidence |
| Our platform | Agent and provider SDKs, purchase mandates, vendor evaluation, rail selection, delivery verification, and reconciliation |
| Stablecoin issuer | Issues and manages the stablecoin and its reserves |
| Card network/acquirer | Processes conventional merchant card acceptance |
| Provider | Publishes the offer and delivers the purchased product or service |

## Relationship to Stripe

The long-term ambition can be described as:

> Stripe for agent-initiated commerce, with Rain handling cards and money movement and Monad handling machine-native payments and programmable evidence.

Rain and Monad do not automatically reproduce Stripe's complete product suite. Stripe also offers mature merchant acquiring, checkout, billing, subscriptions, fraud tooling, disputes, reporting, tax products, and broad merchant distribution.

The practical strategy is to integrate existing systems rather than rebuild all of Stripe:

- Rain for agent-side cards and money movement;
- Monad for machine-native payments and onchain evidence;
- Stripe or another processor when a provider needs conventional card acceptance;
- our platform as the common orchestration and assurance layer.

## Hackathon implementation

The hackathon should demonstrate one narrow vertical slice:

1. An agent receives a GTM purchasing objective.
2. The buyer SDK constructs a structured mandate.
3. The agent compares multiple providers.
4. A small API purchase settles through Monad x402 or MPP.
5. A larger conventional purchase uses a Rain scoped card.
6. The system verifies delivery against the mandate.
7. One receipt connects intent, authorization, payment, and outcome.

Vendor quotes and delivered data may be simulated, but at least one Rain action and one Monad transaction should be real.

## Product progression

### Hackathon proof

- one GTM purchasing workflow;
- one Rain transaction;
- one Monad transaction;
- deterministic delivery verification;
- one lifecycle view.

### Initial product

- TypeScript buyer SDK;
- MCP server;
- installable agent skills;
- hosted policy and transaction dashboard;
- Rain and Monad integrations;
- software, data, and API purchasing.

### Expanded platform

- provider SDK;
- additional card, bank, wallet, and stablecoin rails;
- merchant and offer discovery;
- payment routing;
- delivery attestations and dispute workflows;
- cross-rail reconciliation;
- provider performance and reputation data.

### Network opportunity

The eventual network connects:

- agents seeking products and services;
- providers publishing machine-readable offers;
- payment rails executing different transaction types;
- companies defining purchasing policies;
- finance and compliance teams requiring evidence.

The hackathon project proves the transaction lifecycle. The startup becomes the universal commerce and assurance layer connecting agents, providers, and payment infrastructure.
