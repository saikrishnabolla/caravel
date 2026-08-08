# Tomorrow's Implementation Knowledge

This folder turns the product research into a build-ready technical reference.

## Read in this order

1. [Recommended stack](01-recommended-stack.md)
2. [Agent, tools, and MCP](02-agent-and-mcp.md)
3. [Rain integration](03-rain-integration.md)
4. [Monad, x402, and MPP](04-monad-x402-mpp.md)
5. [Purchase assurance](05-purchase-assurance.md)
6. [Provider and delivery verification](06-provider-and-delivery.md)
7. [Application, data, testing, and CLI tools](07-app-data-testing.md)
8. [Tomorrow's build runbook](08-tomorrow-runbook.md)

Downloaded repositories are indexed in [starters/README.md](../starters/README.md).

## Recommended technical decision

For the two-day build, use:

- Next.js and TypeScript for the application;
- OpenAI Agents SDK for the agent;
- Zod for structured mandates and tool inputs;
- direct function tools first, with MCP added after the purchase flow works;
- Rain directly for the scoped-card transaction;
- Monad x402 for the small paid data/API call;
- viem for EVM signing and transaction reads;
- local JSON or SQLite for private evidence;
- an optional minimal Monad contract only if the main payment flow is already stable.

Do not try to build the complete SDK platform tomorrow. Prove one transaction lifecycle first.

## Important discovery

The x402 Foundation already publishes examples for:

- paid MCP tools;
- an OpenAI chatbot that automatically pays for MCP tool calls;
- signed provider offers and signed delivery receipts;
- provider discovery through the Bazaar extension;
- idempotent retries through payment identifiers;
- Next.js, Express, Hono, Fastify, Fetch, and Axios integrations.

These are reusable protocol primitives. Our distinct work is:

- converting a business request into a purchase mandate;
- applying company-specific policy and vendor comparison;
- routing between Monad machine payments and Rain cards;
- checking the quality and completeness of the delivered result;
- presenting one cross-rail receipt that a finance or operations user can understand.
