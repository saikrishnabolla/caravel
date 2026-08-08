# Tomorrow's Build Runbook

## Before the workshops

1. Confirm Node and pnpm work.
2. Create the Next.js application.
3. Add Zod and the OpenAI Agents SDK.
4. Create the mandate, quote, policy, and delivery schemas.
5. Add fixed CRM, vendor quote, successful delivery, and failed delivery fixtures.
6. Implement the mock Rain adapter.
7. Open the downloaded x402 and OpenAI example files.

## During the Rain workshop

1. Obtain API documentation and sandbox credentials.
2. Ask for the shortest scoped-card transaction flow.
3. Ask for sample webhook payloads and signature verification.
4. Confirm what transaction proof the judges expect.
5. Replace the mock Rain adapter only after one request works independently.

## During the Monad workshop

1. Confirm the current testnet network, facilitator, and USDC address.
2. Obtain MON and testnet USDC.
3. Run the official x402 server and client flow before modifying it.
4. Confirm whether the x402 signed offer/receipt extension works with Monad registration.
5. Ask whether a separate audit contract materially improves the bounty submission.

## First working milestone

By early Saturday afternoon:

- user request becomes a mandate;
- three quotes appear;
- one quote is rejected deterministically;
- one provider is selected;
- delivery fixtures can pass or fail verification.

No blockchain or card dependency should block this milestone.

## Second working milestone

By late Saturday afternoon:

- direct x402 purchase works on Monad testnet;
- transaction hash and delivered resource are captured;
- the application verifies the delivered resource.

## Third working milestone

By Saturday evening:

- Rain transaction works through the adapter;
- authorization or transaction status appears in the timeline;
- the same mandate can route one small purchase to x402 and one larger purchase to the Rain card.

## Sunday morning

1. Add the OpenAI agent around already-working functions.
2. Add human approval for one exception case.
3. Add MCP packaging only if the direct flow is stable.
4. Add signed x402 offer/receipt or the audit contract only if time remains.
5. Polish the timeline and failure explanation.

## Stop conditions

Do not add another framework, protocol, or chain if:

- Rain has not yet completed a transaction;
- Monad has not yet produced a real transaction;
- delivery verification is not visible;
- the three-minute demo is not reliable.

## Three-minute demo

### 0:00–0:30 — Problem

“Agents can now spend money, but companies cannot tell whether they purchased the correct thing or received what they paid for.”

### 0:30–1:00 — Mandate and comparison

Enter the GTM request. Show structured budget and quality requirements. Show one rejected quote.

### 1:00–1:40 — Monad payment

The agent calls the small paid data service. Show the 402 flow, Monad settlement, transaction hash, and returned data.

### 1:40–2:20 — Rain card

The agent makes the larger conventional purchase using a scoped Rain card. Show authorization and applied controls.

### 2:20–2:45 — Delivery verification

Show count, duplicates, quality rate, and pass/fail result.

### 2:45–3:00 — Startup vision

“This becomes one SDK for agents that buy and one SDK for providers that sell, across x402, cards, and transfers.”

## Definition of done

- real Rain action;
- real Monad transaction;
- autonomous agent decision;
- deterministic business-policy enforcement;
- delivered-output verification;
- one understandable receipt and timeline;
- stable live demo with fallback recording.
