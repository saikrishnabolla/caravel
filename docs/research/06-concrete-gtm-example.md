# Concrete Example: An AI GTM Agency Buys Qualified-Lead Data

## The real-world customer

Consider an AI-native outbound agency managing campaigns for 20 B2B software companies.

The agency uses a Clay-style GTM workflow to:

- identify target accounts;
- enrich company and contact records;
- research buying signals;
- verify email addresses;
- generate personalized messages;
- launch sequences and update the CRM.

Clay is a real example of this category. Its current product describes a data marketplace containing 200+ data and AI vendors, agentic account research, workflow orchestration, CRM enrichment, outbound execution, ads, and sequencing.

Clay already simplifies vendor access through its marketplace. The proposed product is not a replacement for Clay. It becomes valuable when an autonomous agent can purchase across Clay and external data/API vendors, or when a Clay-like platform wants to expose controlled autonomous procurement to customers.

## Purchase request

An agency operator gives the agent this task:

> Build a list of 1,000 US finance leaders at Series B–D SaaS companies. Spend no more than $750. Use approved data providers. Pay no more than $0.45 per verified contact, achieve at least 90% valid work emails, and do not buy data already present in our CRM.

This is a business mandate, not merely a card limit.

## What the agent purchases

The agent may need to buy:

- company and contact enrichment credits;
- intent or hiring-signal data;
- email verification calls;
- pay-per-use web research;
- LLM/API usage for personalization;
- a temporary export or campaign add-on.

Some vendors may accept a normal card. Others may expose an x402 or MPP endpoint priced per lookup or per verified result.

## End-to-end workflow

1. **Create the mandate.** The agent converts the operator's request into structured constraints: audience, maximum total spend, maximum unit price, approved providers, quality threshold, deadline, and prohibited data reuse.
2. **Inspect existing assets.** It checks the CRM and previous campaign purchases to remove duplicates.
3. **Build the purchase plan.** It compares available providers, expected coverage, price, delivery format, and privacy constraints.
4. **Evaluate the plan.** The assurance engine checks whether the proposed combination satisfies the mandate and company policy.
5. **Escalate if necessary.** A human is asked only when the plan exceeds a threshold, uses a new vendor, or has unresolved data/privacy risk.
6. **Execute payment.** A scoped Rain virtual card pays a conventional SaaS merchant. A Monad x402/MPP payment can pay a machine-readable service per call or result.
7. **Verify delivery.** The system confirms that the promised number of records arrived, duplicate records were excluded, required fields exist, and the email-validity threshold was met.
8. **Record evidence.** The mandate hash, policy version, approval, vendor, amount, payment identifier, and delivery-result hash are recorded on Monad. Personal lead data remains offchain.
9. **Reconcile.** The system links the purchase to the client, campaign, invoice, CRM records, and accounting category.
10. **Respond to failure.** If delivery is incomplete or quality is below the promised threshold, the system blocks release where possible or prepares refund/dispute evidence.

## Component map

| Component | Job | Example implementation |
|---|---|---|
| Operator interface | Captures the campaign request | Simple chat or form |
| GTM agent | Plans the list-building workflow | LLM with structured tool calls |
| Clay-style orchestrator | Runs enrichment, research, sequencing, and CRM updates | Clay integration or mocked workflow |
| Mandate compiler | Converts natural language into testable fields | JSON schema with budget, unit price, providers, and quality |
| CRM/deduplication connector | Prevents repurchasing existing data | HubSpot/Salesforce mock or CSV |
| Vendor catalog | Normalizes provider quotes and terms | Three mocked vendors plus one live paid endpoint |
| Assurance engine | Applies deterministic business and risk checks | Rules plus an explanation layer |
| Human approval | Handles exceptions | One approval screen/button |
| Rain integration | Issues or uses a scoped card and enforces financial controls | Rain sandbox/API |
| Monad payment | Pays a machine-readable digital service | x402 facilitator or MPP SDK |
| Delivery verifier | Tests count, schema, duplication, and quality | Deterministic validation code |
| Evidence store | Stores full private evidence | Application database/object store |
| Monad audit contract | Stores non-sensitive commitments and lifecycle events | EVM smart contract/events |
| Reconciliation view | Shows request → approval → payment → delivery | Demo timeline/dashboard |

## What each company contributes

| Layer | Responsibility |
|---|---|
| Clay or GTM platform | Finds prospects and runs the GTM workflow |
| Our assurance layer | Determines whether the proposed purchase satisfies intent and verifies the result |
| Rain | Executes controlled card or money-movement transactions |
| Monad | Settles machine payments and records shared evidence |
| Stablecoin issuer | Issues and manages the stablecoin |
| Data/API vendor | Delivers enrichment, verification, research, or personalization output |

## What Rain already covers versus what we add

| Rain Agent Control Layer | Proposed assurance layer |
|---|---|
| Maximum transaction amount | Maximum cost per valid delivered lead |
| Merchant allowlist | Whether this vendor/product is appropriate for this exact campaign |
| Spend interval | Whether this purchase duplicates previous data or subscriptions |
| Card expiration | Whether the delivered dataset meets count and quality promises |
| Program-level spend caps | Cross-client attribution and reconciliation |
| Block transaction outside configured rules | Explain why the purchase satisfies the original business mandate |

## Buyer for this example

- **First buyer:** founder/COO or Head of Operations at the GTM agency.
- **Champion:** GTM engineer or automation lead building the agent workflow.
- **Daily user:** campaign operations and finance operations.
- **Risk reviewer:** client security/privacy contact, because lead data can contain personal information.

The agency pays because one incorrect autonomous purchase can waste money, contaminate a client's CRM, violate a data policy, or damage client trust.

## Demo success statement

> An agent received a campaign goal, compared three data suppliers, rejected one overpriced option, paid one provider with a Rain card and another through Monad x402, verified 90%+ valid delivery, and produced one audit trail linking intent to outcome.
