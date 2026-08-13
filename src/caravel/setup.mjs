import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { buildApiProduct } from "./build.mjs";
import { configureProduct } from "./configure.mjs";
import { connectAndReport } from "./tools.mjs";

function yes(value) {
  return ["y", "yes"].includes(value.trim().toLowerCase());
}

export async function runSetup(root = process.cwd(), options = {}) {
  const prompts = options.prompts ?? createInterface({ input, output });
  try {
    const source = options.source ?? await prompts.question("OpenAPI URL or file: ");
    const upstreamBaseUrl = options.upstreamBaseUrl ?? await prompts.question("Upstream API base URL: ");
    const apiKeyHeader = options.apiKeyHeader ?? (await prompts.question("Customer API-key header [X-API-Key]: ") || "X-API-Key");
    const enableX402 = options.enableX402 ?? yes(await prompts.question("Add Monad testnet x402 payments? [y/N]: "));
    let x402PayTo;
    if (enableX402) x402PayTo = options.x402PayTo ?? await prompts.question("Monad receiving address: ");
    await connectAndReport(source, { root, type: "openapi" });
    await configureProduct(root, {
      upstreamBaseUrl,
      apiKeyHeader,
      x402Preset: enableX402 ? "monad-testnet" : undefined,
      x402PayTo,
    });
    return buildApiProduct(root);
  } finally {
    if (!options.prompts) prompts.close();
  }
}
