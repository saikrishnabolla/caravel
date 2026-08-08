# Two-Day Hackathon Demo Plan

## Demo objective

Show one complete autonomous purchase in which:

- the agent receives a measurable GTM goal;
- the purchase is evaluated against business intent;
- Rain moves real or sandboxed money;
- Monad performs a meaningful payment or evidence function;
- delivery is checked before the task is considered complete.

## Minimum scope

Build only the following:

1. One chat/form request for a qualified-lead dataset.
2. One structured purchase mandate.
3. Three simulated vendor quotes.
4. One deterministic selection and rejection explanation.
5. One Rain scoped-card transaction or authorization flow.
6. One Monad x402/MPP payment or audit-contract transaction.
7. One simulated delivered CSV/API response.
8. One quality check for count, duplicates, required fields, and email-validity rate.
9. One lifecycle screen showing mandate, approval, payment, delivery, and evidence.

## Suggested architecture

```text
User request
    ↓
GTM purchasing agent
    ↓
Structured mandate + vendor quotes
    ↓
Assurance policy engine
    ├── exception → human approval
    └── approved
          ├── Rain scoped card → conventional data vendor
          └── Monad x402/MPP → machine-payable API
                         ↓
                  delivered dataset
                         ↓
                  quality verifier
                         ↓
       private evidence store + Monad audit event
```

## Day 1

- Define mandate schema and fixed demo story.
- Build the agent tools and deterministic policy checks.
- Integrate the Rain sandbox/API path.
- Deploy the minimal Monad contract or connect x402/MPP.
- Create fixed vendor responses and delivery dataset.

## Day 2

- Complete delivery verification and lifecycle view.
- Add clear failure states: overpriced vendor and poor-quality delivery.
- Make the Rain and Monad transactions visible in the demo.
- Rehearse a three-minute narrative.
- Remove everything not required for the end-to-end story.

## What not to build

- a general procurement platform;
- a full merchant reputation network;
- production accounting integrations;
- generalized escrow and dispute adjudication;
- real scraping of thousands of personal records;
- multi-chain abstractions;
- complex machine-learning fraud detection.

## Judge-facing story

1. Agents can already pay, but businesses cannot safely delegate open-ended purchasing authority.
2. Rain enforces financial boundaries before money moves.
3. Our layer proves that the proposed purchase matches the business request and that delivery occurred.
4. Monad makes machine payment and lifecycle evidence fast, programmable, and independently verifiable.
5. The GTM example has an obvious buyer and measurable ROI.

## Feasibility

A convincing demonstration is feasible in two days if vendor selection and delivery are mostly simulated while at least one Rain action and one Monad action are real. A production-ready startup product is not feasible in two days.
