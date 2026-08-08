# Purchase Assurance

## This is the part we build

Existing payment infrastructure can enforce an amount and move money. Our assurance code answers whether the proposed purchase satisfies the business request.

## Purchase mandate

Represent the user's request as structured data:

```typescript
const PurchaseMandate = z.object({
  mandateId: z.string(),
  objective: z.string(),
  maximumTotalUsd: z.number().positive(),
  maximumUnitPriceUsd: z.number().positive(),
  minimumQuantity: z.number().int().positive(),
  approvedProviders: z.array(z.string()),
  minimumValidEmailRate: z.number().min(0).max(1),
  excludeExistingCrmRecords: z.boolean(),
  expiresAt: z.string().datetime(),
});
```

For the demo, the model may extract this structure from natural language, but deterministic code validates it before any tool can spend money.

## Vendor quote

Normalize every provider into the same shape:

```typescript
const VendorQuote = z.object({
  providerId: z.string(),
  productId: z.string(),
  quantity: z.number().int().positive(),
  totalPriceUsd: z.number().nonnegative(),
  estimatedValidEmailRate: z.number().min(0).max(1),
  deliveryMethod: z.enum(["api", "csv"]),
  paymentMethods: z.array(z.enum(["x402", "rain-card", "transfer"])),
  offerExpiresAt: z.string().datetime(),
});
```

## Deterministic policy checks

Implement these as normal TypeScript conditions, not LLM judgments:

```text
total price <= mandate maximum
price per delivered unit <= unit-price maximum
provider is approved
offer has not expired
quantity meets requested minimum
estimated quality meets threshold
purchase is not a duplicate
mandate has not expired
payment destination matches the selected provider
```

Return a list of pass/fail reasons for every quote. The demo should visibly reject at least one provider.

## Human approval

Require approval when:

- provider is new;
- transaction exceeds a chosen threshold;
- quality evidence is missing;
- payment destination changed;
- the agent requests an exception;
- Rain or x402 details do not exactly match the approved quote.

Reuse the OpenAI Agents SDK human-in-the-loop example rather than building an elaborate workflow engine.

## Rail selection

Use simple rules:

```text
if provider supports Monad x402 and purchase is a small digital/API call:
    use x402
else if provider accepts ordinary online card checkout:
    use Rain card
else if purchase is a larger approved invoice:
    use transfer only if Rain exposes the required sandbox flow
else:
    require human intervention
```

Do not ask the LLM to optimize fees dynamically during the hackathon.

## Unified receipt

Store one private application-level record:

```typescript
type PurchaseReceipt = {
  mandateId: string;
  selectedQuoteId: string;
  policyVersion: string;
  policyResults: Array<{ rule: string; passed: boolean; reason: string }>;
  approval?: { approvedBy: string; approvedAt: string };
  payment: {
    rail: "x402-monad" | "rain-card";
    providerTransactionId: string;
    amountUsd: number;
  };
  delivery: {
    receivedAt: string;
    quantity: number;
    duplicateCount: number;
    validEmailRate: number;
    passed: boolean;
  };
};
```

Use an x402 signed receipt when available and link it to this record. The application receipt remains necessary because it includes buyer-specific policy and quality checks that the payment protocol does not know.

## Failure cases to demonstrate

The demo is more convincing if it includes:

1. an overpriced vendor rejected before payment;
2. an acceptable x402 provider paid on Monad;
3. a Rain-card purchase allowed within controls;
4. delivered data rejected when its quality is too low;
5. a clear record explaining each decision.
