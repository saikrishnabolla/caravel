# Downloaded Starter Repositories

These repositories were downloaded on August 7, 2026 as implementation references. They are upstream projects, not code authored for this hackathon.

## `monad-mcp-tutorial`

- Source: <https://github.com/monad-developers/monad-mcp-tutorial>
- Downloaded commit: `1b177e4`
- Purpose: Official tutorial for an MCP server that reads Monad Testnet state with viem.
- Useful files: `src/index.ts`, `package.json`, `README.md`
- Warning: Uses the MCP v1 package and is older than the current MCP v2 SDK.

## `foundry-monad`

- Source: <https://github.com/monad-developers/foundry-monad>
- Downloaded commit: `9e542ee`
- Purpose: Official Monad-configured Foundry template.
- Use if: We add a minimal audit-event contract.
- Useful files: `foundry.toml`, `src/`, `script/`, `test/`

## `monad-ts`

- Source: <https://github.com/monad-crypto/monad-ts>
- Downloaded commit: `164848c`
- Purpose: Official Monad TypeScript packages.
- Most relevant directory: `packages/mpp/`
- Package: `@monad-crypto/mpp`
- Warning: The MPP package is under active development.

## `openai-agents-js`

- Source: <https://github.com/openai/openai-agents-js>
- Downloaded commit: `510e91f`
- Purpose: Agent orchestration, tools, guardrails, approvals, MCP, and tracing.
- Most useful directories:
  - `examples/nextjs/`
  - `examples/agent-patterns/human-in-the-loop.ts`
  - `examples/mcp/`
  - `examples/basic/tools.ts`
- Runtime: Node.js 22 or later.

## `mcp-typescript-sdk`

- Source: <https://github.com/modelcontextprotocol/typescript-sdk>
- Downloaded commit: `cc4b416`
- Purpose: Current MCP TypeScript implementation and examples.
- Most useful files:
  - `docs/get-started/first-server.md`
  - `docs/serving/stdio.md`
  - `examples/README.md`
- Warning: The checked-out main branch is MCP v2. x402's paid MCP examples currently use MCP v1.

## `x402`

- Source: <https://github.com/x402-foundation/x402>
- Downloaded commit: `8bef6f7`
- Checkout: Sparse checkout containing `examples`, `typescript`, `specs`, and root files.
- Purpose: Official x402 protocol, TypeScript packages, paid MCP tools, clients, servers, provider discovery, offers, receipts, and payment identifiers.
- Most useful directories:
  - `examples/typescript/fullstack/next/`
  - `examples/typescript/clients/fetch/`
  - `examples/typescript/servers/mcp/`
  - `examples/typescript/clients/mcp/`
  - `examples/typescript/clients/mcp-chatbot/`
  - `examples/typescript/servers/offer-receipt/`
  - `examples/typescript/clients/offer-receipt/`
  - `examples/typescript/servers/payment-identifier/`
  - `examples/typescript/servers/bazaar/`
  - `typescript/packages/mcp/README.md`

## Not downloaded

### Rain SDK

No maintained public Rain SDK repository was established. Use the authenticated official Rain API documentation and workshop materials.

### Sponge SDK

Sponge documents `@paysponge/sdk`, its CLI, MCP integration, cards, x402, and MPP, but no corresponding public GitHub source repository was established in the search. Use <https://docs.paysponge.com/>.

### Framework source repositories

Next.js, viem, Zod, and other general libraries were not cloned because their published packages and documentation are sufficient. Cloning their full source would add noise without accelerating the two-day build.
