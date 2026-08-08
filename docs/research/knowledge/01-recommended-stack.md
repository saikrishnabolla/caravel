# Recommended Stack

## Use this stack tomorrow

| Component | Choice | Why |
|---|---|---|
| Runtime | Node.js 22+ | Required by the current OpenAI Agents SDK |
| Package manager | pnpm | Already installed and used by the main starter repositories |
| Language | TypeScript | Shared across the agent, UI, policies, MCP, and payment clients |
| Web application | Next.js App Router | One project can contain the UI and API routes |
| Agent | `@openai/agents` | Tools, guardrails, approval flows, MCP support, and tracing |
| Schemas | Zod | Structured mandate and safe tool inputs |
| Machine payment | `@x402/core`, `@x402/evm`, `@x402/fetch`, `@x402/next` | Official x402 v2 path documented by Monad |
| Monad client | viem | Used by Monad's official examples and packages |
| Alternative machine payment | `@monad-crypto/mpp`, `mppx` | Monad-native MPP option; keep as fallback |
| MCP | x402's current v1-compatible MCP packages | Existing paid-tool examples work without a migration |
| Rain | Direct Rain API or sandbox access provided at the workshop | Strongest proof for the Rain prize |
| Private evidence | Local JSON first; SQLite only if needed | Lowest setup risk for a hackathon |
| Contract tools | Monad Foundry: `forge` and `cast` | Official Monad contract template and deployment flow |
| Testing | Vitest or deterministic scripts plus MCP Inspector | Fast validation without building a large test suite |

## One application, not many services

The simplest architecture is:

```text
Next.js application
├── user interface
├── agent route
├── mandate and policy code
├── mocked vendor catalog
├── delivery verifier
├── Rain adapter
├── Monad x402 client
└── private evidence log

Separate local provider service
└── x402-protected data endpoint on Monad
```

Only introduce a separate MCP server after the direct paid endpoint works.

## Build versus reuse

### Build ourselves

- business mandate schema;
- deterministic policy checks;
- vendor comparison;
- Rain-versus-x402 rail decision;
- delivery-quality verification;
- unified transaction timeline.

### Reuse

- OpenAI Agents SDK tool execution and approval patterns;
- x402 payment handling and Monad facilitator;
- x402 offer/receipt extension if time permits;
- MCP protocol and Inspector;
- viem chain interaction;
- Monad Foundry project configuration;
- Rain's existing financial controls.

## Current local tool status

At research time:

- Node.js: installed;
- npm: installed;
- pnpm: installed;
- Git: installed;
- Bun: not found;
- Forge: not found;
- Cast: not found.

The Monad MPP example uses Bun, but it can be adapted or Bun can be installed later. The preferred x402 path does not require Bun.

## Compatibility warning

The current MCP TypeScript SDK repository's main branch is v2 and publishes `@modelcontextprotocol/server` and `@modelcontextprotocol/client`.

The x402 paid-MCP examples currently use the v1 package `@modelcontextprotocol/sdk`. Monad's MCP tutorial also uses v1.

For a two-day build:

> Do not migrate x402's paid MCP example to MCP v2.

Use the versions pinned by the x402 example. Keep the v2 SDK checkout as a future reference.
