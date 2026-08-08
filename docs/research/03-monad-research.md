# Monad Research

## What Monad provides

Monad is a high-performance, EVM-compatible Layer 1 blockchain. The hackathon brief describes throughput up to 10,000 transactions per second. Its compatibility allows developers to use familiar Ethereum tooling while targeting Monad.

For agentic commerce, Monad's documentation highlights high throughput, sub-second finality, and low fees for machine-to-machine transactions.

## Agent-payment tooling

Monad currently documents two relevant mechanisms:

### x402 facilitator

An HTTP service can respond with `402 Payment Required` and a structured payment requirement. The client signs a payment authorization, the server verifies it, serves the resource, and the facilitator settles the payment onchain.

The documented facilitator:

- supports Monad mainnet and testnet;
- verifies payment signatures;
- performs onchain settlement;
- covers gas for clients;
- supports usage-based or per-call payments;
- works with USDC on Monad.

### Machine Payments Protocol

Monad publishes the `@monad-crypto/mpp` TypeScript/JavaScript SDK for constructing and managing programmatic machine payments.

## Monad's useful role in the proposed product

Monad should perform a job that is independently valuable:

- settle a pay-per-result data or API purchase;
- record the hash of the original purchase mandate;
- record approval, merchant quote, and payment identifiers;
- record a delivery attestation or dispute state;
- provide a shared audit record for buyer, platform, and seller.

Sensitive lead data, personal information, prompts, and full receipts should remain offchain. Only identifiers, hashes, amounts, policy versions, and non-sensitive status events should be recorded.

## Competition and differentiation

Monad competes for developers and applications with Ethereum Layer 2 networks and other fast Layer 1 networks. Competitors emphasize some combination of low fees, speed, liquidity, distribution, existing applications, developer tooling, and payments partnerships.

For this hackathon, merely deploying an ordinary EVM contract on Monad will not show why Monad matters. The demo should benefit from fast machine settlement or a multi-party, tamper-evident transaction lifecycle.

## Main product risk

If the Rain card already settles through card networks, an onchain receipt can look ornamental. The stronger architecture uses Monad for one of these:

1. a real x402/MPP purchase from a digital vendor;
2. an escrow or conditional-release step;
3. a policy and delivery record relied upon by more than one party;
4. a persistent reputation or dispute signal.
