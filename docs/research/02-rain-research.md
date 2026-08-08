# Rain Research

## What Rain has shipped and is emphasizing

Rain describes itself as a global stablecoin payments platform for enterprises, fintechs, developers, and AI agents. Its products include wallets, card issuing, rewards, onramps, offramps, virtual accounts, and payments.

The most relevant recent launch is the **Agent Control Layer**, available in beta. Rain says agents have already used its infrastructure to book travel, subscribe to software, run procurement workflows, and move money.

The control layer includes:

- per-agent transaction limits;
- merchant and merchant-category allowlists;
- spend intervals and card expiration;
- approved counterparties, amounts, frequency, and timing for money movement;
- program-level active-card and aggregate-spend limits;
- enforcement before card authorization or transfer initiation.

This means “add spending limits to an agent card” is not a sufficient new product. Rain already does that.

## What Rain does not establish by itself

Rain can determine whether a proposed transaction falls within configured financial controls. It does not, by that fact alone, prove:

- the agent interpreted the user's request correctly;
- the selected vendor offers the best acceptable option;
- the price is reasonable relative to alternatives;
- the purchase is not semantically duplicative of an existing subscription;
- the merchant delivered the promised output;
- the delivered data, API response, booking, or service met a quality threshold;
- evidence from card, onchain, merchant, and internal systems has been reconciled.

That post-authorization and purchase-intent gap is the proposed startup boundary.

## How Rain makes money

Rain is infrastructure sold to businesses and platforms. Likely revenue surfaces include platform and implementation fees, card economics, foreign-exchange or money-movement fees, and commercial pricing for wallets, issuing, and compliance infrastructure. Exact customer pricing was not established in this research.

Rain is closer to an issuing/payments infrastructure provider than a consumer bank or a “glorified wallet.” It coordinates multiple regulated and technical layers so another company can offer a branded financial product.

## What Rain's hiring indicates

Rain's job board showed 44 open positions during the research, concentrated in New York. The roles suggest five active investments:

1. **Agentic payments and AI tooling** — an early backend AI team working on LLM tool calling, structured outputs, retrieval, evaluations, and permission-aware access.
2. **Cards** — authorization behavior, ledgers, network integrations, spend controls, lifecycle, activation, and partner adoption.
3. **Multi-chain infrastructure** — EVM, Solana, and Stellar systems; smart contracts; real-time ingestion; high-volume processing.
4. **Fraud and risk** — low-latency anomaly detection, behavioral analysis, explainability, monitoring, and adversarial robustness.
5. **Compliance and licensing** — transaction monitoring, sanctions, customer due diligence, reconciliation, regulatory reporting, and audit readiness.

The cultural signals emphasize autonomy, speed, ownership, and shipping working products.

## Implication for the hackathon

The project should demonstrate:

- a real autonomous payment using Rain;
- controls that complement, rather than duplicate, Rain's Agent Control Layer;
- a narrow workflow with measurable business value;
- evidence, evaluation, or risk logic that makes an agent safer in production.
