# Monad, x402, and MPP

## Recommended choice: x402 first

Monad officially documents both x402 and MPP. Use x402 as the primary hackathon path because:

- Monad publishes a complete Next.js guide;
- the x402 Foundation provides client, server, MCP, and receipt examples;
- the facilitator can verify and settle payments;
- the flow is easy to explain in a demo;
- it directly represents an agent purchasing an internet resource.

Use MPP as a fallback or an additional experiment after x402 works.

## Official Monad x402 packages

```bash
pnpm add @x402/core @x402/evm @x402/fetch @x402/next viem
```

Monad's guide states that its facilitator supports x402 v2 and later.

Primary documentation:

- <https://docs.monad.xyz/guides/x402>
- <https://docs.monad.xyz/tooling-and-infra/agentic-payments>
- local upstream examples: `starters/x402/`

## Basic demo flow

```text
Agent requests paid lead-enrichment result
    ↓
Provider returns HTTP 402 with price and Monad payment requirement
    ↓
Our policy engine checks mandate and budget
    ↓
Client signs the payment authorization
    ↓
Monad facilitator verifies it
    ↓
Provider returns the result
    ↓
Facilitator settles USDC on Monad
    ↓
Application records the transaction and verifies delivery
```

## x402 components worth reusing

### Fetch client

`@x402/fetch` wraps normal Fetch and automatically handles payment-required responses.

Local example:

- `starters/x402/examples/typescript/clients/fetch/`

### Next.js provider endpoint

`@x402/next` protects a Next.js route.

Local example:

- `starters/x402/examples/typescript/fullstack/next/`

### Paid MCP tools

`@x402/mcp` adds payment wrappers to MCP tools and automatic payment behavior to MCP clients.

Local examples:

- `starters/x402/examples/typescript/servers/mcp/`
- `starters/x402/examples/typescript/clients/mcp/`

### Provider discovery

The Bazaar example makes an x402 endpoint discoverable by agents.

Local example:

- `starters/x402/examples/typescript/servers/bazaar/`

### Signed offers and receipts

The offer/receipt extension signs the provider's terms and its delivery receipt. It supports audit trails and dispute evidence.

Local examples:

- `starters/x402/examples/typescript/servers/offer-receipt/`
- `starters/x402/examples/typescript/clients/offer-receipt/`

This overlaps with part of our original assurance concept. Reuse it rather than inventing a custom receipt format.

Our remaining product value is the buyer's business mandate, multi-vendor comparison, Rain card path, delivered-output quality checks, and unified finance view.

### Payment identifiers

The payment-identifier extension supports idempotent retries and helps prevent accidental duplicate payments.

Local examples:

- `starters/x402/examples/typescript/servers/payment-identifier/`
- `starters/x402/examples/typescript/clients/payment-identifier/`

## Monad MPP alternative

Install:

```bash
pnpm add @monad-crypto/mpp mppx viem
```

Official package source:

- `starters/monad-ts/packages/mpp/`

MPP supports:

- one-time ERC-20 charges;
- push mode, where the client broadcasts and pays gas;
- pull mode, where the client signs an authorization and the server broadcasts;
- a payment receipt header;
- testnet configuration;
- replay protection, with a shared store recommended for multiple server instances.

The package is marked as under active development. Do not attempt to support both MPP and x402 in the minimum demo.

## Optional audit contract

Use a contract only after the x402 transaction works.

A minimal contract could emit events containing:

```text
mandateId
mandateHash
paymentRail
paymentIdentifier
amount
providerId
deliveryHash
status
timestamp
```

Do not put personal lead data, prompts, full receipts, or private commercial terms onchain.

Official Foundry template:

- `starters/foundry-monad/`

Required CLI installation from Monad's documentation:

```bash
curl -L https://foundry.category.xyz | bash
foundryup --network monad
```

This installs `forge`, `cast`, `anvil`, and `chisel` with Monad support.

## Testnet needs

Before the demo, obtain:

- a fresh development wallet;
- Monad testnet MON for gas;
- Monad testnet USDC from Circle's faucet;
- a provider receiving address;
- the current facilitator URL and token address from official docs.

Never use a wallet containing meaningful mainnet funds.
