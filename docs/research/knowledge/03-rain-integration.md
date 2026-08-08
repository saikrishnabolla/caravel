# Rain Integration

## What we need from Rain

The hackathon requires an agent to transact using Rain's payment infrastructure.

The ideal proof is:

1. A scoped virtual card exists for the agent or purchase.
2. The agent initiates a real sandbox or low-value merchant transaction.
3. Rain applies amount, merchant, timing, or program controls.
4. The application receives a transaction or authorization event.
5. The event appears in the unified purchase timeline.

## Documentation status

Rain's API documentation currently redirects to a login. No maintained public Rain SDK repository was established during this research.

Therefore:

- use the official authenticated documentation supplied by Rain;
- obtain sandbox credentials during the workshop;
- ask the Rain engineer for the shortest supported card flow;
- do not invent endpoint names or payloads before seeing the current API.

## Questions for the Rain workshop

1. What is the shortest sandbox flow from account or wallet to a usable virtual card?
2. Can the card be restricted to a merchant, amount, and short expiration window?
3. Which webhook reports authorization, settlement, reversal, and decline?
4. Is there an official TypeScript client, OpenAPI file, Postman collection, or sample repository?
5. Can the demo perform a real low-value online purchase?
6. Which stablecoin and chain should fund the card program in the sandbox?
7. Is the Agent Control Layer exposed through the same APIs during the event?
8. What evidence should be displayed to qualify as autonomous use of Rain?

## Adapter boundary

Create an interface before receiving credentials so the rest of the application can proceed:

```typescript
type PurchaseMandate = {
  mandateId: string;
  merchant: string;
  maximumAmount: number;
  currency: "USD";
  expiresAt: string;
};

type PaymentResult = {
  rail: "rain-card";
  status: "authorized" | "declined" | "settled";
  providerTransactionId: string;
  amount: number;
  merchant?: string;
  occurredAt: string;
};

interface RainPaymentAdapter {
  preparePurchase(mandate: PurchaseMandate): Promise<unknown>;
  executePurchase(input: unknown): Promise<PaymentResult>;
  getTransaction(id: string): Promise<PaymentResult>;
}
```

The exact adapter internals must follow Rain's real API.

## Mock-first strategy

Before the workshop, implement a mock adapter that produces:

- one approved authorization;
- one decline caused by an amount or merchant rule;
- a stable transaction identifier;
- a webhook-like status update.

Once Rain access is available, replace only the adapter internals.

## Sponge contingency

Sponge's public documentation offers:

- TypeScript package `@paysponge/sdk`;
- Python package `paysponge`;
- CLI command `npx spongewallet init`;
- remote MCP integration;
- Rain-issued agent cards;
- x402 and MPP payments;
- wallet, platform, payment, card, and banking APIs.

Sponge's currently documented networks are Ethereum, Base, Tempo, and Solana—not Monad.

Sponge can be a reference or contingency for the card portion, but confirm with the organizers that an indirect Rain-issued card satisfies the Rain track. Direct Rain integration is preferable.

Official Sponge documentation:

- <https://docs.paysponge.com/>
- <https://docs.paysponge.com/llms.txt>

## Security

- Use only test or low-value accounts.
- Keep Rain credentials in local environment variables.
- Never send credentials to the model.
- Verify webhook signatures using Rain's current documentation.
- Store transaction identifiers, not full sensitive card data.
- Do not log PAN, CVC, private keys, or bearer tokens.
