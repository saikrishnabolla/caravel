# Official Starter-Kit Findings and Final Build Decision

## Why this document exists

This document records the latest sponsor guidance, official sandbox resources, prior-art review, credential handling, and the final decision for the hackathon build.

## Sources reviewed

- Rain sandbox API: <https://rain-sandbox-trial.mintlify.site/reference/rain-api>
- Rain quickstart: <https://rain-sandbox-trial.mintlify.site/docs/quickstart>
- Monad builder resources PDF
- Rain hackathon starter-kit PDF
- Awesome Agentic Commerce: <https://github.com/Merit-Systems/awesome-agentic-commerce>
- x402 Foundation: <https://github.com/x402-foundation/x402>
- Monad agentic-payment documentation
- Ondo product and eligibility documentation

## What changed after reviewing the official resources

### Rain implementation is no longer uncertain

The Rain sandbox provides a complete simulated card lifecycle:

1. Fund simulated collateral.
2. Generate a session ID.
3. Create a scoped card.
4. Simulate authorization.
5. Demonstrate a decline.
6. Settle the authorization.
7. Read the transaction back.
8. Reverse or refund if useful.
9. Optionally simulate an onramp or offramp.

We do not need a real merchant checkout or decrypted card number to demonstrate Rain.

### Monad should carry the real onchain payment

The Monad side should perform an x402 USDC transaction on Monad Testnet. This makes Monad essential to delivery of the paid digital resource.

### A generic x402 API is not original

The curated ecosystem already contains:

- x402 clients and servers;
- paid MCP tools;
- agent wallets;
- marketplaces and discovery;
- receipts and payment identifiers;
- payment routers;
- approval guards;
- agent reputation;
- escrow standards.

The Monad one-pager explicitly says paywalled APIs are well-trodden. Our novelty must come from combining the Rain card path, Monad machine payment, business policy, and verification of the delivered result.

## Final project

### Working description

> A policy-controlled purchasing agent for an international hardware-and-software business.

The agent:

- receives a measurable business purchasing request;
- converts it into a structured mandate;
- compares providers;
- rejects an invalid or overpriced offer;
- uses a scoped Rain card for an ordinary merchant;
- uses x402 on Monad for a machine-native service;
- verifies the delivered product or data;
- creates one understandable business receipt.

### Short pitch

> AI agents can now pay, but businesses cannot yet trust them to purchase correctly. We connect the instruction, payment, and delivered result across Rain cards and Monad machine payments.

## Concrete scenario

An international business sells physical hardware and subscription software.

The operator asks:

> Purchase the data and software needed for this customer campaign. Spend no more than $50. Use approved software vendors. Pay no more than $0.40 per valid record, and verify at least 90% quality.

The agent:

1. Reads the mandate.
2. Compares three offers.
3. Rejects an overpriced provider.
4. Creates a Rain card with amount, MCC, and expiry restrictions.
5. Attempts an invalid merchant category and receives a Rain decline.
6. Performs an allowed Rain authorization and settlement.
7. Calls an x402-protected data endpoint.
8. Pays USDC on Monad Testnet.
9. Receives synthetic data.
10. Checks count, duplicates, required fields, and promised quality.
11. Shows the Rain and Monad transaction evidence in one timeline.

## Why the decline is important

The Rain decline demonstrates that the controls are real rather than descriptive UI.

The application should then show a second distinction:

> A payment may be financially authorized but still fail the business objective.

For example, Rain correctly settles a permitted transaction, but the delivered dataset may contain duplicates or fail the promised quality threshold.

This demonstrates the need for our assurance layer.

## Sponsor alignment

### Best use of Rain

- Agent autonomously creates and uses a scoped card.
- Rain enforces amount, merchant category, and expiration.
- Transaction progresses through authorization and settlement.
- Application reads the transaction record.

### General track

- Agent initiates two transactions.
- One transaction uses a conventional card rail.
- One transaction uses a machine-native payment rail.

### Best implementation of Monad using Rain

- Rain handles the conventional merchant purchase.
- Monad x402 handles the paid digital resource.
- Both are required by the same agent mandate.
- Monad is not merely storing a decorative receipt.

## What not to build in the minimum version

- Ondo integration;
- automatic yield allocation;
- lending or borrowing;
- ERC-8004 registration;
- ERC-8183 escrow;
- MPP in addition to x402;
- general MCP marketplace;
- provider reputation network;
- production database;
- complete accounting system;
- real personal lead data;
- live international bank settlement.

These remain roadmap possibilities.

## Ondo decision

Ondo demonstrates that businesses can use tokenized Treasury products for onchain cash management. USDY is relevant to the long-term idea of earning yield on idle operating balances.

It is excluded from the hackathon critical path because:

- USDY was not officially listed on Monad;
- eligibility and jurisdiction checks apply;
- Rain did not establish that a card can spend directly against USDY or OUSG;
- integration would consume time without satisfying the primary Rain and Monad requirements.

## Credential handling

Create the following local file:

```text
/Users/saikrishnabolla/Documents/GitHub/raingentic/.env.local
```

Expected entries:

```bash
RAIN_API_BASE_URL=https://api-dev.raincards.xyz/v1
RAIN_API_KEY=<provided sandbox value>
RAIN_USER_ID=<provided sandbox value>
RAIN_TEAM_ID=<provided sandbox value>
RAIN_CONTRACT_ID=<provided sandbox value>
```

Never paste the values into chat or commit them.

The repository must ignore:

```gitignore
.env*
!.env.example
.secrets/
```

The `sessionid` value is generated for each scoped-card request. It is not stored as a permanent credential.

## Two-hour proof gate

Before building the interface, prove:

### Rain

- API authentication works.
- Collateral funding simulation works.
- Scoped-card creation works.
- MCC mismatch produces a decline.
- Approved authorization succeeds.
- Settlement succeeds.
- Transaction can be retrieved.

### Monad

- Development wallet is available.
- Wallet has testnet MON and USDC.
- x402 endpoint returns `402 Payment Required`.
- Agent/client signs the payment.
- Facilitator settles on Monad.
- Paid resource is returned.
- Explorer shows the transaction.

If either external path is blocked, take the exact request and response to the sponsor engineer immediately.

## Eight-hour execution plan

### Hour 0-2: External smoke tests

- Configure Rain credentials server-side.
- Complete the Rain quickstart through settled transaction.
- Complete the Monad x402 example.

### Hour 2-3: Business rules

- Define mandate schema.
- Create three provider offers.
- Implement deterministic policy evaluation.
- Implement delivery pass/fail fixtures.

### Hour 3-5: Integrate transactions

- Add Rain adapter.
- Add Monad x402 client.
- Store transaction identifiers and statuses.
- Add idempotency keys for Rain writes.

### Hour 5-6: Agent orchestration

- Connect agent tools.
- Require policy approval before spending.
- Add one human-approval exception.

### Hour 6-7: Interface

Show:

```text
Mandate
→ Quotes
→ Policy decision
→ Rain decline
→ Rain settlement
→ Monad x402 purchase
→ Delivery verification
→ Final receipt
```

### Hour 7-8: Reliability

- Rehearse three-minute presentation.
- Record fallback video.
- Save explorer link.
- Save Rain transaction IDs.
- Remove incomplete features.

## Definition of done

- real Rain sandbox resources and settled transaction;
- real Monad Testnet transaction;
- agent makes a purchasing decision;
- deterministic guardrails prevent an invalid purchase;
- delivered result is verified;
- transaction timeline is understandable without crypto knowledge;
- no credentials or private information are exposed;
- live demonstration has a fallback recording.

## Long-term startup vision

After the hackathon, the system can become:

- a buyer SDK for platforms building purchasing agents;
- a provider SDK for businesses selling to agents;
- a routing layer across cards, x402, transfers, and stablecoins;
- a purchase-assurance and reconciliation service;
- eventually, a treasury system capable of controlled yield allocation and international settlement.
