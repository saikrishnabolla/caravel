# Foundations: Stablecoins, Rain, Monad, and Stripe

## Why not simply hold dollars?

For an individual paying ordinary US expenses, holding dollars in a bank account and using a normal credit card is usually simpler.

Stablecoins become useful when software must move dollar-like value:

- globally and outside banking hours;
- between internet-native wallets;
- programmatically, without a human completing every checkout;
- across borders where correspondent banking is slow or expensive;
- through onchain protocols that can verify and settle machine payments.

A stablecoin is a digital token intended to maintain a stable value, commonly one US dollar. The issuer—not Rain or Monad—manages the backing. For example, Circle issues USDC and publishes information about its reserves.

Stablecoins still introduce issuer, wallet, blockchain, compliance, and smart-contract risks. They are not automatically safer than bank deposits and are not generally the same as an FDIC-insured bank balance.

## What Rain is

Rain provides payments infrastructure that lets companies build stablecoin-funded wallets, cards, onramps, offramps, virtual accounts, and money movement products.

Rain is not the stablecoin issuer and does not promise to hold one dollar of reserves for every USDC. Its own site states that Rain is not a bank, exchange, or asset custodian and does not hold deposits. Payment and banking products involve licensed partners.

For agents, Rain supplies the practical spending rail:

- issue a scoped virtual card;
- fund spending from a stablecoin balance;
- set amount, merchant, category, timing, and frequency restrictions;
- approve or reject a card authorization before money moves;
- use card networks to pay ordinary online merchants.

## What Monad is

Monad is an EVM-compatible Layer 1 blockchain. It executes transactions, runs smart contracts, orders activity, and produces a shared onchain record.

It is not a card network, wallet, stablecoin issuer, or bank. In this project it is useful for:

- fast, low-cost settlement for machine-to-machine payments;
- x402 or MPP payments for APIs and digital services;
- recording policy commitments, approvals, receipts, and delivery attestations;
- creating a tamper-evident audit trail shared by multiple parties.

Calling Monad a “highway” is only an analogy. More precisely, it is a programmable ledger and execution environment on which applications can transact and run agreed rules.

## A corrected Apple Card analogy

The earlier analogy was directionally helpful but technically incomplete:

| Apple-style example | Agentic-commerce equivalent |
|---|---|
| Apple Wallet interface | The agent application or purchasing interface |
| Card issuer and processor | Rain and its licensed/card-network partners |
| Dollars in a bank account | Stablecoins held through the relevant wallet/custody arrangement |
| Card network authorization and settlement | Rain plus Visa/Mastercard ecosystem |
| Programmable public ledger | Monad, when the workflow uses onchain payment or evidence |
| Dollar token issuer | Circle for USDC or another stablecoin issuer |

Monad is not required for every Rain card purchase. A strong hackathon implementation must give Monad an independent job rather than merely writing an arbitrary transaction to it.

## What Stripe is doing with stablecoins

Stripe is integrating stablecoins into its existing financial infrastructure rather than asking every business to become a crypto company.

Its current crypto offering describes:

- accepting stablecoin payments while settling merchants in fiat;
- stablecoin payouts;
- stablecoin-backed card issuing;
- global wallet and treasury capabilities;
- Bridge for stablecoin orchestration;
- Privy for wallet infrastructure;
- Tempo, a payments-focused Layer 1 incubated by Stripe and Paradigm;
- Open USD as shared stablecoin infrastructure.

The strategy is to make stablecoins another underlying money rail inside familiar payment, treasury, issuing, and platform products.
