# Application, Data, Testing, and CLI Tools

## Application shell

Create a Next.js TypeScript application:

```bash
pnpm create next-app purchase-assurance-demo
```

Choose:

- TypeScript;
- ESLint;
- Tailwind CSS;
- `src/` directory;
- App Router.

Do not add a separate frontend framework.

## Suggested application folders

```text
src/
├── app/
│   ├── page.tsx
│   └── api/
│       ├── agent/route.ts
│       ├── provider/route.ts
│       └── rain/webhook/route.ts
├── agent/
│   ├── purchasing-agent.ts
│   └── tools.ts
├── assurance/
│   ├── mandate.ts
│   ├── policy.ts
│   ├── quotes.ts
│   └── delivery.ts
├── payments/
│   ├── rain-adapter.ts
│   ├── rain-mock.ts
│   └── monad-x402.ts
├── evidence/
│   ├── store.ts
│   └── receipt.ts
└── demo-data/
    ├── crm.json
    ├── quotes.json
    ├── delivery-pass.json
    └── delivery-fail.json
```

## Persistence

Use an in-process store or JSON files for the first working version.

Only add SQLite if multiple restarts or concurrent requests become a real problem. A database is not a judging criterion.

Never store private keys or API credentials in the data store.

## Environment variables

Expected categories:

```text
OPENAI_API_KEY
MONAD_RPC_URL
MONAD_NETWORK
MONAD_USDC_ADDRESS
MONAD_FACILITATOR_URL
MONAD_BUYER_PRIVATE_KEY
MONAD_PROVIDER_ADDRESS
RAIN_API_BASE_URL
RAIN_API_KEY
RAIN_WEBHOOK_SECRET
```

Use exact Rain variable names only after reading its documentation.

Create `.env.example` with placeholders and ensure `.env*` secrets are ignored.

## CLI tools

### Node and pnpm

Use for the Next.js app and TypeScript packages.

### MCP Inspector

```bash
npx @modelcontextprotocol/inspector <server-command>
```

Use it to list and call commerce tools before connecting the agent.

### Monad Foundry

- `forge`: build, test, and deploy contracts;
- `cast`: create wallets, read chain state, and send transactions;
- `anvil`: local EVM node;
- `chisel`: Solidity REPL.

Foundry was not installed at research time.

### Circle and Monad faucets

Use the official Circle faucet for Monad testnet USDC and Monad's official faucet for gas tokens. Faucet availability and limits can change.

## Testing strategy

Do not build a large test suite. Test the critical invariants.

### Unit tests

- mandate parsing rejects missing budgets;
- policy rejects unapproved vendors;
- policy rejects excess total and unit prices;
- policy rejects expired offers;
- duplicate detection works;
- delivery threshold passes and fails correctly;
- rail selection is deterministic.

### Integration checks

- x402 endpoint returns 402 without payment;
- paid retry returns the resource;
- Monad transaction hash is recorded;
- Rain mock decline and approval both appear correctly;
- real Rain transaction replaces the mock without changing other code;
- agent cannot call a payment tool with altered amount or destination.

### Demo rehearsal

- clean startup from a fresh terminal;
- known funded test wallet;
- fixed sample request;
- visible block-explorer link;
- visible Rain transaction identifier;
- prerecorded fallback for external-service failure.

## Observability

Use:

- OpenAI Agents SDK tracing for the agent run;
- structured application events for policy and payment steps;
- x402 settlement response and Monad explorer link;
- Rain webhook or transaction status;
- one user-facing lifecycle timeline.

Avoid adding a separate observability platform during the hackathon.
