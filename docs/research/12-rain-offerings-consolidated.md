# Rain: Consolidated Research and Understanding

## Simple explanation

Rain gives businesses and software agents a way to use stablecoin-funded financial infrastructure in places that still operate through cards, bank transfers, and ordinary merchant systems.

For this project, the simplest description is:

> Rain lets an AI agent safely spend money through a controlled virtual card and move money between fiat and stablecoin rails.

Rain is not the stablecoin issuer, a blockchain, or the company backing USDC. It is also not itself a bank. Rain works with card networks, licensed institutions, banks, stablecoin systems, and other infrastructure providers.

## Why Rain exists

Most merchants do not accept stablecoins or x402 payments. They accept Visa, Mastercard, ACH, wires, and local banking methods.

A business may hold stablecoins but still need to purchase:

- software subscriptions;
- cloud infrastructure;
- sales and marketing tools;
- travel;
- physical components;
- shipping services;
- advertising;
- ordinary online products.

Rain connects the stablecoin-based business balance to those existing payment systems.

## Main Rain capabilities

### Wallet and balance infrastructure

Rain enables partners to build wallet and balance products involving supported stablecoins and fiat rails.

### Card issuing

Rain can issue virtual cards that work through existing card networks. Merchants process these as ordinary card transactions.

This is useful because an agent does not have to wait for every merchant to support crypto or agent-specific payment protocols.

### Scoped cards for agents

Rain's scoped cards are purpose-specific virtual cards. The hackathon sandbox supports controls including:

- requested lifetime spending amount;
- merchant-category-code allowlist;
- expiration time;
- authorization enforced by Rain before the transaction succeeds.

Rain's documentation says it applies a default 1.2x ceiling to the requested transaction amount to accommodate authorization holds or adjustments. Our application should preserve its own stricter business budget rather than assuming the Rain ceiling is the complete purchasing policy.

### Agent Control Layer

Rain's Agent Control Layer allows a platform to define what an agent may do before it acts.

Published controls include:

- transaction limits;
- merchant and category allowlists;
- spend intervals;
- card expiration;
- approved counterparties;
- transfer amount, timing, and frequency;
- program-level limits across cards and users.

These controls are applied before card authorization or transfer initiation.

### Transactions

Rain provides transaction records for authorization, decline, settlement, reversal, and refund flows.

### Payment routes

Rain payment routes can represent:

- fiat to crypto onramps;
- crypto to fiat offramps;
- incoming bank payments routed to an onchain address;
- supported onchain deposits routed to a fiat payment account.

The exact supported countries, currencies, banking systems, and blockchains vary. We must not claim Canadian or other jurisdictional support without verifying the current Rain product configuration.

### Virtual accounts and bank rails

Rain can support virtual-account and money-movement products through its regulated and banking partners. This can let a customer send an ordinary bank payment while the platform receives or routes value through stablecoin infrastructure.

## Business example

Imagine an international company that sells industrial hardware and accompanying software.

It may need to:

- receive a $50,000 customer payment;
- purchase components and shipping;
- subscribe to data and cloud services;
- pay international suppliers;
- convert between stablecoins and local bank balances.

Rain could support different portions of that flow:

| Business activity | Possible Rain role |
|---|---|
| Agent buys SaaS | Scoped virtual card |
| Agent buys physical component | Scoped virtual card |
| US customer sends bank payment | Virtual account or payment route |
| Business converts fiat to stablecoin | Onramp/payment route |
| Business converts stablecoin to fiat | Offramp/payment route |
| Finance team audits spending | Transaction records and controls |

## What Rain does not determine

Rain can determine whether a transaction satisfies the configured financial controls. That does not automatically prove:

- the agent understood the business request;
- the selected product was the best acceptable option;
- the price was reasonable;
- the purchase was not duplicative;
- the merchant delivered what was promised;
- the delivered data or service met its quality requirement;
- the expense was assigned to the correct customer or project.

That is the role of our purchase-assurance layer.

## Rain's hackathon priorities

The presentation described four areas of interest:

1. **Autonomous spend** — agents that spend, settle, or receive money autonomously.
2. **Global money movement** — cross-border and multi-currency flows involving routing, FX, or swaps.
3. **Treasury and payouts** — conditional disbursement, marketplace settlement, and rebalancing.
4. **Agent negotiation** — agent-to-agent pricing and autonomous deal-making.

Our minimum project directly covers autonomous spend. It can partially cover agent negotiation through provider quotes and counteroffers. Global movement and treasury remain expansion paths unless we show them working.

## Official Rain sandbox

### Base URL

```text
https://api-dev.raincards.xyz/v1
```

### Provisioned values

Each team receives:

```text
Api-Key
userId
teamId
contractId
```

### Authentication

Every API request includes:

```text
Api-Key: <team sandbox key>
```

POST and PATCH requests also use:

```text
Content-Type: application/json
```

The API key must remain on the server. It must never be exposed to browser code, an agent prompt, logs, or Git.

### Session ID

Creating a scoped card requires a `sessionid` header. This is not another credential Rain provides.

The application:

1. Generates a fresh 32-character hexadecimal secret.
2. Encrypts it using Rain's sandbox RSA public key with RSA-OAEP.
3. Sends the encrypted value as the `sessionid` header.
4. Receives encrypted PAN and CVC values.

Our demonstration does not need to decrypt or display the card number or CVC. The returned card ID and last four digits are sufficient for the simulator.

### Sandbox quickstart

#### 1. Simulate collateral funding

```http
POST /simulate/collateral/fund
```

Example body:

```json
{
  "contractId": "RAIN_CONTRACT_ID",
  "currency": "rusd",
  "amount": 100000
}
```

The amount is in cents, so `100000` represents $1,000.

#### 2. Create a scoped card

```http
POST /issuing/users/{userId}/cards/scoped
```

Example body:

```json
{
  "amountInUSDCents": 5000,
  "allowedMccs": ["7372"],
  "expiresAt": "future ISO-8601 timestamp"
}
```

The endpoint returns a card ID, last four digits, expiration, status, and encrypted card details.

#### 3. Simulate authorization

```http
POST /simulate/transactions/authorize
```

Example body:

```json
{
  "cardId": "RAIN_CARD_ID",
  "amount": 2500,
  "currency": "USD",
  "merchantName": "Approved Data Vendor",
  "merchantCategoryCode": "7372"
}
```

The sandbox can demonstrate both approval and decline scenarios. Documented decline reasons include blocked MCC, locked or canceled card, credit-limit violation, restricted country, expiry mismatch, and CVV mismatch.

#### 4. Settle authorization

```http
POST /simulate/transactions/{transactionId}/settle
```

The authorization becomes a posted transaction.

#### 5. Read transactions

```http
GET /issuing/transactions?limit=20
```

#### 6. Simulate cross-rail payment route

```http
POST /payment-routes
POST /simulate/payment-routes
```

The official example creates an ACH-to-USDC route using Base. It does not establish that the Rain sandbox can route directly to Monad.

## Idempotency

Rain supports `Idempotency-Key` on write requests.

Use a unique key for each intended operation and reuse it only when retrying that exact operation. Rain caches idempotent responses for 24 hours. This prevents duplicate cards, routes, or transfer simulations after timeouts or retries.

## Security rules

- Use sandbox credentials only.
- Never put the API key in an agent prompt.
- Never commit `.env.local`.
- Do not store decrypted card details.
- Use synthetic cardholder data.
- Use idempotency keys.
- Do not log API keys, session secrets, PAN, or CVC.
- Rotate or discard credentials after the demonstration as directed by Rain.

## Rain's role in our project

Rain is responsible for:

- simulated collateral;
- issuing the scoped card;
- enforcing amount, MCC, and expiry controls;
- authorization and settlement;
- creating an auditable transaction record;
- optional simulation of cross-rail money movement.

Our system is responsible for deciding why the purchase is allowed and whether the business received the promised result.

## Primary sources

- <https://rain-sandbox-trial.mintlify.site/reference/rain-api>
- <https://rain-sandbox-trial.mintlify.site/docs/quickstart>
- <https://rain-sandbox-trial.mintlify.site/reference/cards/create-a-scoped-card-for-a-user>
- <https://rain-sandbox-trial.mintlify.site/reference/simulate/simulate-a-card-authorization>
- <https://rain-sandbox-trial.mintlify.site/reference/idempotency>
- `raingentic-hackathon-starter-kit.pdf`
