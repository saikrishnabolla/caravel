# Provider and Delivery Verification

## Provider endpoint

For the demo, create a small paid API that returns synthetic GTM contact data.

Example endpoint:

```text
GET /api/providers/enrich?quantity=100
```

Without payment it returns an x402 payment requirement. After payment it returns a generated JSON or CSV dataset.

## Recommended provider implementation

Fastest path:

- use the Monad Next.js x402 guide;
- protect one Next.js route with `@x402/next`;
- use Monad Testnet and the official facilitator;
- return synthetic data after successful verification.

Local references:

- `starters/x402/examples/typescript/fullstack/next/`
- `starters/x402/examples/typescript/servers/express/`
- Monad guide: <https://docs.monad.xyz/guides/x402>

## Machine-readable provider offer

Publish a small JSON offer:

```json
{
  "providerId": "signal-data",
  "productId": "verified-finance-leads",
  "description": "Synthetic finance-leader enrichment",
  "unit": "valid_contact",
  "priceUsd": 0.35,
  "minimumQuantity": 100,
  "promisedValidEmailRate": 0.9,
  "payment": {
    "rail": "x402",
    "network": "eip155:10143"
  }
}
```

If time permits, replace the custom offer with x402's signed offer/receipt extension.

## Delivery checks

Keep verification deterministic:

- number of delivered records;
- required columns or JSON fields;
- duplicate records within the delivery;
- duplicates already present in the sample CRM;
- valid email syntax;
- percentage marked as verified by the synthetic provider;
- company and title filters;
- hash of the delivered file or normalized JSON.

Do not claim that a simple regular expression proves an email account exists. For the demonstration, the dataset should contain a provider-supplied verification status and the verifier should check the promised ratio.

## Suggested synthetic fields

```text
contact_id
first_name
last_name
title
company
company_stage
country
work_email
email_status
source_provider
```

## Useful packages

- Zod for JSON and schema validation;
- Papa Parse if the delivery is CSV;
- Node/Web Crypto or viem utilities for hashing;
- built-in `URL` and Fetch APIs for endpoint handling.

Avoid adding a large data-processing framework.

## Provider failure modes

Prepare two fixed provider responses:

### Successful delivery

- correct quantity;
- no prohibited duplicates;
- valid-email rate above the mandate threshold.

### Failed delivery

- missing records;
- repeated CRM contacts;
- valid-email rate below the threshold.

The failed delivery proves why our product is more than a payment button.

## Privacy

Use only synthetic people and companies in the demonstration.

Do not scrape or display real personal contact data during the hackathon. Keep the full delivered dataset offchain and record only a hash and summary metrics on Monad.
