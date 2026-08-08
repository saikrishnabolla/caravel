# Agent, Tools, and MCP

## Agent framework

Use the OpenAI Agents SDK package:

```bash
pnpm add @openai/agents zod
```

Relevant capabilities already provided by the SDK:

- function tools;
- structured schemas;
- input and output guardrails;
- human approval before selected tools run;
- MCP servers over stdio or Streamable HTTP;
- tool filtering;
- tracing of agent runs;
- a Next.js human-in-the-loop example.

Local reference:

- `starters/openai-agents-js/README.md`
- `starters/openai-agents-js/examples/nextjs/`
- `starters/openai-agents-js/examples/agent-patterns/human-in-the-loop.ts`
- `starters/openai-agents-js/examples/mcp/`

## Recommended agent tools

Start with ordinary function tools inside the application:

```text
inspect_existing_data
list_vendor_quotes
evaluate_purchase
request_human_approval
pay_x402_provider
pay_rain_merchant
verify_delivery
finalize_receipt
```

The agent may propose actions, but deterministic TypeScript code must enforce budgets, allowed vendors, unit-price limits, duplicate checks, and delivery thresholds.

Do not allow the language model to directly choose an arbitrary URL, amount, or wallet destination and then send money without validation.

## Where MCP fits

MCP is the packaging layer that can later expose the same commerce functions to different agent platforms.

Potential public tools:

```text
commerce.create_mandate
commerce.search_offers
commerce.evaluate_purchase
commerce.pay
commerce.verify_delivery
commerce.get_receipt
```

For the hackathon, MCP is useful when it visibly demonstrates that a reusable agent tool can require and receive an x402 payment.

## Paid MCP starter

The x402 repository already includes:

- paid MCP server: `starters/x402/examples/typescript/servers/mcp/`
- paid MCP client: `starters/x402/examples/typescript/clients/mcp/`
- OpenAI chatbot with paid tools: `starters/x402/examples/typescript/clients/mcp-chatbot/`
- package documentation: `starters/x402/typescript/packages/mcp/README.md`

The example payment flow is:

1. Client discovers an MCP tool.
2. Agent decides to call it.
3. Server returns a payment requirement.
4. x402 client requests approval.
5. Client signs the payment.
6. Server verifies and executes the tool.
7. Settlement occurs.
8. Client receives the result and payment receipt.

## How to adapt it

The examples default to Base Sepolia. Replace the network registration and facilitator with the values from Monad's x402 guide:

- Monad Testnet CAIP-2 network: `eip155:10143`;
- Monad x402 facilitator: `https://x402-facilitator.molandak.org`;
- Monad Testnet USDC address: use the current value in Monad's guide;
- x402 version: v2 or later.

Do not copy token addresses from memory. Recheck the official Monad guide at build time.

## MCP development tools

The official MCP Inspector can test a local stdio server without configuring a full agent host:

```bash
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

Local references:

- `starters/mcp-typescript-sdk/docs/get-started/first-server.md`
- `starters/monad-mcp-tutorial/`

## Recommended sequence

1. Implement the tools as plain TypeScript functions.
2. Connect them to the OpenAI agent.
3. Make the x402 HTTP purchase work.
4. Wrap one provider action as a paid MCP tool.
5. Use MCP Inspector before connecting the agent.

This prevents MCP transport problems from blocking the core payment demo.
