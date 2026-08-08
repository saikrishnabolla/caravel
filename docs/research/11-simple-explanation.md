# The Idea in Simple Words

## What are we trying to do?

We want to let an AI agent safely buy things for a person or company.

Today, an AI agent can search the internet, compare information, fill out forms, and call software tools. New payment products also let an agent use a card or send a stablecoin.

But giving an agent access to money creates a bigger problem:

> How do we know the agent bought the correct thing, at an acceptable price, from an acceptable seller, and actually received what it paid for?

Our product sits between the agent and the payment system. It checks the purchase before money moves and checks the result after the purchase.

## A simple example

A sales agency asks an AI agent:

> Find 1,000 finance leaders at US software companies. Spend no more than $750. Do not buy contacts already in our CRM. At least 90% of the email addresses must be valid.

The agent then:

1. Checks what data the company already owns.
2. Finds several data providers.
3. Compares their prices and promised quality.
4. Rejects providers that are too expensive or not approved.
5. Selects the best acceptable option.
6. Pays the provider.
7. Checks the delivered contact list.
8. Confirms that the list contains 1,000 records and at least 90% valid emails.
9. Saves a receipt showing what was requested, approved, paid for, and delivered.

The important part is not only that the agent can pay. The important part is that the company can understand and trust the entire purchase.

## What Rain does

Rain gives the agent a way to spend money through normal payment systems.

Rain can provide:

- a virtual card;
- a stablecoin-funded balance;
- limits on how much the agent may spend;
- rules about which merchants it may use;
- rules about when and how often it may spend;
- transfers, onramps, and offramps.

An onramp converts ordinary money into stablecoins. An offramp converts stablecoins back into ordinary money or sends value into the banking system.

Rain is the payment infrastructure. It is not the company issuing and backing a stablecoin such as USDC.

## What Monad does

Monad is a blockchain on which software can make and record transactions.

For our project, Monad can do two useful things:

1. Let an agent make very small automatic payments to APIs using x402 or MPP.
2. Record proof that a purchase was requested, approved, paid for, and delivered.

We should not store private customer or lead data on Monad. We store only safe identifiers, amounts, timestamps, and digital fingerprints of the evidence.

## What x402 means

x402 lets a website or API say:

> This information costs money. Pay this amount and I will return it.

The agent can automatically approve the small payment, send it, and receive the result without creating an account or manually entering a card.

This is useful for small purchases such as:

- one company record;
- one verified email address;
- one research report;
- one image-generation request;
- one API call;
- one piece of machine-readable data.

## Why use cards as well?

Most internet merchants do not support x402 or stablecoin payments. They already accept Visa or Mastercard.

A Rain virtual card lets the agent pay those existing merchants without waiting for every website to adopt a new payment system.

The payment router can therefore choose:

- x402 or MPP for small machine-to-machine purchases;
- a Rain card for normal online checkout;
- a stablecoin or bank transfer for larger invoices and international payments.

## What our product does

Rain and Monad move or record money. Our product understands the business purchase surrounding that money.

Our system provides:

- **The instruction:** What exactly is the agent allowed to buy?
- **The budget:** How much may it spend in total and per item?
- **The comparison:** Which providers satisfy the request?
- **The approval:** Is this purchase allowed to proceed?
- **The payment choice:** Should it use x402, a card, or a transfer?
- **The delivery check:** Did the seller provide what was promised?
- **The receipt:** Can finance understand the full story later?
- **The response to failure:** Should the company seek a refund or dispute the purchase?

## A useful analogy

Imagine a company sends a junior employee out with a corporate card.

The card company can enforce a $750 limit and block unapproved merchants. But the card company does not know whether the employee bought the correct dataset, whether the company already owned it, or whether 90% of the email addresses worked.

Our product acts like a careful purchasing manager standing beside that employee. It understands the request, checks the choice, and examines what was delivered.

The difference is that the employee is an AI agent and the purchasing manager is software.

## Who uses it?

### Companies building AI agents

They install our SDK, MCP server, or agent skill so their agents can purchase things safely.

### Companies using purchasing agents

Their finance, procurement, operations, or GTM teams define budgets and rules and review the completed transactions.

### Providers selling to agents

They install a provider SDK that publishes their products, prices, payment options, and delivery promises in a format agents can understand.

## Who pays us?

The likely customer is a company, not an individual consumer.

The person approving the contract may be:

- a CFO;
- a Controller;
- a Head of Procurement;
- a COO;
- a Head of AI or automation;
- a product leader at an agent platform.

They pay because incorrect autonomous purchases can waste money, create security or compliance problems, introduce bad data, and make accounting difficult.

## Why does this not already exist?

Parts of it do exist.

- Rain already provides cards, money movement, and spending controls.
- Monad already provides blockchain transactions and machine-payment tooling.
- Sponge already gives agents wallets, Rain-issued cards, x402/MPP support, and spending limits.
- Stripe provides extensive payments, stablecoin, card, wallet, and merchant infrastructure.
- Agent platforms already let AI systems use tools and APIs.

What is not yet complete is one common layer that connects the full business story:

> request → comparison → approval → payment → delivery → verification → receipt

There are several reasons.

### Agent purchasing is new

Until recently, most AI agents did not have permission to move real money. Payment infrastructure for agents is only beginning to reach production.

### Every purchase is different

Verifying an API response is different from verifying a flight, hotel room, software subscription, contractor project, or physical delivery.

### Payment systems are fragmented

Some sellers accept cards, some accept bank transfers, and a small but growing group accept stablecoins or x402.

### Liability is difficult

If the agent buys the wrong thing, responsibility could belong to the user, agent developer, payment platform, or seller. The industry has not settled these rules.

### Compliance and privacy are difficult

Moving money and purchasing data can involve identity checks, sanctions, fraud, privacy, licensing, taxes, and record-keeping.

### Providers must participate

Delivery verification becomes much stronger when providers publish clear prices, terms, and proof of delivery. Most providers do not yet offer a standard agent-readable interface.

### Infrastructure companies may build parts of it

Rain, Stripe, Sponge, and agent platforms could add deeper controls themselves. Our product must therefore work across payment providers and become valuable through vendor intelligence, verification, and cross-rail evidence.

## Can we build it in two days?

We cannot build the complete company or universal platform in two days.

We can build a convincing demonstration of the most important idea.

## What we can build in two days

The demonstration can include:

1. A user asks the agent to purchase a qualified-lead dataset.
2. The agent converts the request into clear purchasing rules.
3. Three sample providers return different prices and quality promises.
4. The system rejects one expensive or unapproved provider.
5. The agent selects an acceptable provider.
6. A real Rain card authorization or payment occurs.
7. A real Monad x402/MPP payment or audit transaction occurs.
8. The provider returns a sample dataset.
9. The system checks duplicates, record count, required fields, and email quality.
10. A screen shows the request, decision, payment, delivery, and final receipt.

The provider quotes and delivered dataset can be simulated. The Rain and Monad transactions should be real sandbox, testnet, or low-value transactions.

## What we cannot build in two days

We should not attempt:

- a complete universal marketplace;
- production integrations with many providers;
- support for every kind of product;
- full accounting and tax systems;
- production-grade fraud and compliance infrastructure;
- a universal refund and dispute network;
- a complete merchant reputation system;
- legal rules covering responsibility for every agent purchase.

## The two-day test

The project succeeds if the audience can see:

1. The agent was given a clear business goal.
2. The agent made a real purchasing decision.
3. Rain allowed the agent to move money safely.
4. Monad performed a necessary machine-payment or evidence function.
5. The system checked whether the correct result was delivered.
6. A human can understand why the purchase happened.

## The shortest pitch

> AI agents can now spend money, but businesses still cannot trust them to purchase correctly. We connect the instruction, payment, and delivered result so companies can safely give agents purchasing authority.

## Hackathon versus startup

### Hackathon

Prove one complete purchase from request to verified delivery.

### Initial startup

Provide an SDK and dashboard for agents buying software, APIs, data, and digital services.

### Long-term platform

Become the common commerce layer connecting purchasing agents, providers, cards, bank transfers, stablecoins, and machine-payment protocols.
