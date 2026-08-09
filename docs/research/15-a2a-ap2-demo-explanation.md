# A2A and AP2 in Our Demo

## The simple distinction

- **A2A lets agents communicate:** discover each other, exchange offers, negotiate, and agree on what should be purchased.
- **AP2 proves purchasing authority:** who authorized the agent, which seller and product are allowed, the maximum amount, and the permitted payment method.
- **Monad x402 moves the machine-native payment.**
- **Rain moves the card payment for a traditional provider.**

AP2 does not move money. It is the signed permission slip checked before money moves.

## Our selling side

PreFlight's customer agent wants to buy a mission-readiness verification from our seller agent.

```text
Customer/business
  defines the request and spending limit
          |
          v
Customer buying agent
  discovers and negotiates with our seller through A2A
          |
          v
AP2 authorization
  "This agent may buy this product from MissionClear
   for exactly $0.01 using x402 USDC"
          |
          v
MissionClear seller verifies the AP2 mandates
          |
          v
Monad x402 payment
          |
          v
MissionClear releases the paid API result
```

The seller checks that the authorization names the correct merchant, payment instrument, and exact amount before releasing the product.

## Our buying and fulfillment side

After making the sale, MissionClear needs data from a traditional upstream provider.

```text
MissionClear/business
  authorizes its fulfillment agent
          |
          v
AP2 authorization
  "This agent may spend this exact amount with AeroData
   using a Rain card"
          |
          v
Our Rain executor verifies the AP2 mandates
          |
          v
Rain creates a scoped virtual card
  exact amount + allowed merchant category + expiration
          |
          v
AeroData card authorization and settlement
          |
          v
Upstream data is used to fulfill the customer order
```

## What the authorization contains

The official AP2 mandate chain binds:

- the buyer and delegated agent;
- the permitted merchant;
- the product and quantity;
- the actual and maximum amount;
- the payment instrument;
- the intended audience;
- a unique nonce and expiration.

If the amount is above the limit, the audience is wrong, or the mandate is modified, verification fails.

## What we should say tomorrow

> A2A handles discovery and negotiation between the buyer and seller agents. Google's official AP2 mandates prove that each agent is authorized for the exact purchase. Monad x402 settles the customer-facing machine payment, while Rain executes the controlled upstream card purchase.

## Current implementation boundary

We use Google's official AP2 Python SDK to create and verify open and closed Checkout and Payment Mandates on both flows. The demo keeps mandate bundles in the application's memory and passes an authorization reference internally. This demonstrates real mandate creation and verification, but it is not a claim of complete AP2 interoperability with every external agent platform.
