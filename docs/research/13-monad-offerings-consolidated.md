# Monad: Consolidated Research and Understanding

## Simple explanation

Monad is a programmable blockchain compatible with Ethereum applications and tooling.

For this project, the simplest description is:

> Monad gives an AI agent an onchain account, fast payment settlement, and programmable rules for machine-to-machine commerce.

Monad is not a bank, card company, stablecoin issuer, investment manager, or lending company. Those services may be built on Monad by other applications.

## Why Monad exists in this project

Rain connects agents to ordinary merchants and banking/card rails. Monad handles internet-native transactions where software pays software directly.

Monad's presentation emphasized three properties:

1. **Identity** — an agent can possess or control an account without completing a traditional bank application.
2. **Finality** — software can determine that an onchain payment has settled rather than reconciling an authorization later.
3. **Programmability** — rules can be enforced through signed messages and smart contracts.

## Network properties

The official builder one-pager lists:

- approximately 0.3-second block time;
- approximately 0.6-second finality;
- up to 10,000 transactions per second;
- EVM equivalence.

These properties are useful for frequent agent transactions and micropayments.

## Accounts are code

An agent can generate or control a cryptographic account. It does not need to open a traditional financial account through a human checkout flow before receiving or sending an onchain payment.

This does not remove compliance obligations from the application or business. It means the blockchain account itself is technically available to software.

## Payments are code

An onchain payment can be:

- signed by software;
- checked before submission;
- executed against a known network and token;
- confirmed by the blockchain;
- referenced through a transaction hash;
- used as a condition before serving a digital resource.

## x402 payments

x402 turns HTTP `402 Payment Required` into a machine-payment protocol.

### Flow

1. Agent requests an API or resource.
2. Provider responds with a price and payment requirements.
3. Agent checks its purchasing mandate and budget.
4. Agent signs a USDC payment authorization.
5. Facilitator verifies it.
6. Provider returns the resource.
7. Facilitator settles the payment on Monad.
8. Application records the result and transaction hash.

### Why it matters

x402 supports:

- pay-per-call APIs;
- small data purchases;
- machine-to-machine payments;
- usage-based software services;
- purchases without creating a subscription or account;
- automatic payment retry through client wrappers.

### Official resources

```text
Guide:       https://docs.monad.xyz/guides/x402
Facilitator: https://x402-facilitator.molandak.org
Version:     x402 v2
```

Primary packages:

```text
@x402/core
@x402/evm
@x402/fetch
@x402/next
```

Monad's facilitator requires x402 version 2 or later. The official guide specifies `@x402/evm >= 2.2.0` for the exact scheme.

## Machine Payments Protocol

Monad also supports MPP through:

```text
@monad-crypto/mpp
mppx
viem
```

MPP can support one-time ERC-20 charges using:

- push mode, where the client broadcasts;
- pull mode, where the client signs an authorization and the server broadcasts.

For the hackathon, x402 is the recommended first path. Supporting both x402 and MPP would increase implementation risk without improving the minimum demonstration.

## MCP and agent tools

Monad publishes an MCP tutorial for exposing blockchain actions as agent tools.

The wider x402 ecosystem also includes paid MCP tools, in which:

1. Agent discovers a tool.
2. Tool reports a price.
3. Agent approves the payment according to policy.
4. x402 settles the tool call.
5. Tool returns the result and receipt.

MCP is useful as a future SDK packaging layer. It is optional for the first working demonstration.

## Agent identity

Monad documentation includes ERC-8004 guidance for trustless agent identity and reputation.

Potential uses include:

- registering an agent identity;
- associating payments with an agent;
- building reputation from completed transactions;
- allowing providers to check an agent's history.

ERC-8004 is an expansion feature. It should not block the Rain-card and x402 transaction path.

## Escrow and non-HTTP delivery

The wider ecosystem includes ERC-8183, an agentic-commerce escrow standard for services whose completion cannot be proven by receiving an HTTP `200` response.

This is relevant to contractor work, physical goods, and complex deliverables. It is not necessary for the first digital-data demonstration.

## Savings, lending, and yield

Monad itself does not invest money or pay interest. Applications deployed on Monad or integrated through infrastructure providers may offer:

- staking;
- lending;
- borrowing;
- vault strategies;
- stablecoin yields;
- portfolio tracking;
- transaction construction for yield deposits and withdrawals.

Monad's documentation lists infrastructure providers including:

- Blend;
- Pods Finance;
- Vaults.fyi;
- Veda;
- Yield.xyz.

Yield.xyz documents native MON staking and broader API support for DeFi strategies. Its Monad staking integration involves MON, not a stablecoin, and has an unbonding period. This is not equivalent to an immediately spendable stablecoin balance.

## Ondo clarification

Ondo provides tokenized financial products such as:

- USDY, a yield-bearing tokenized note backed primarily by short-term US Treasuries and bank deposits;
- rUSDY, a rebasing representation;
- OUSG, a qualified-access tokenized Treasury product.

Ondo is useful evidence for the long-term treasury vision, but its official USDY network list did not include Monad during this research. OUSG and USDY also have eligibility and jurisdiction restrictions.

Therefore, Ondo should not be a dependency for the hackathon implementation.

## Relationship between Rain and Monad

The combined model is:

```text
Stablecoin or account on Monad
        ↓
Machine-native API purchase through x402

Business purchasing mandate
        ↓
Scoped Rain card
        ↓
Ordinary merchant receives card payment
```

Rain's card sandbox and Monad's x402 testnet are separate technical transactions connected by our application-level business workflow.

We should not claim that the Rain sandbox directly settles its card collateral on Monad unless the organizers or API configuration explicitly establish that integration.

## Official Monad test resources

```text
Mainnet chain:       143
Testnet chain:       10143
Testnet RPC:         https://testnet-rpc.monad.xyz
MON faucet:          https://faucet.monad.xyz
USDC faucet:         https://faucet.circle.com
Explorer:            https://monadvision.com
Alternative explorer:https://monadscan.com
```

The official builder one-pager lists Monad Testnet USDC at:

```text
0x534b2f3A21130d7a60830c2Df862319e593943A3
```

Token addresses must always be rechecked against official documentation before use.

## What Monad wants in hackathon submissions

The presentation and builder one-pager emphasized:

- use real transactions on Monad;
- make the chain necessary to the product;
- give the agent meaningful autonomy;
- add guardrails;
- avoid building only another generic paywalled API;
- explore stablecoin cards plus agents and agent-to-agent economies.

## Monad's role in our project

Monad should perform a necessary purchase:

- agent calls an x402-protected data or software endpoint;
- purchasing policy approves the price and provider;
- USDC payment settles on Monad;
- provider returns a digital resource;
- application verifies the delivered resource;
- explorer transaction links the purchase to the demonstration.

Optional later additions include identity, reputation, escrow, yield allocation, or a custom audit contract.

## Primary sources

- <https://docs.monad.xyz/tooling-and-infra/agentic-payments>
- <https://docs.monad.xyz/guides/x402>
- <https://docs.monad.xyz/reference/mpp>
- <https://docs.monad.xyz/guides/erc-8004>
- <https://docs.monad.xyz/guides/monad-mcp>
- <https://docs.monad.xyz/tooling-and-infra/earn-yield>
- `raingentic-monad-builder-one-pager.pdf`
