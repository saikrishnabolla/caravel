import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { workspacePath } from "./workspace.mjs";

function accessMethods(options) {
  const methods = [];
  if (options.apiKey !== false) {
    methods.push({
      type: "api-key",
      header: options.apiKeyHeader ?? "X-API-Key",
      environmentVariable: "CARAVEL_API_KEYS",
    });
  }
  if (options.x402Price || options.x402PayTo) {
    if (!options.x402PayTo) throw new Error("--x402-pay-to is required when x402 is enabled.");
    methods.push({
      type: "x402",
      scheme: "exact",
      pricing: options.x402Price ? { type: "fixed", price: `$${Number(options.x402Price).toFixed(2)}` } : { type: "per-product" },
      network: options.x402Network ?? "eip155:84532",
      payTo: options.x402PayTo,
    });
  }
  if (!methods.length) throw new Error("At least one access method is required.");
  return methods;
}

export function createProductManifest(catalog, options = {}) {
  const methods = accessMethods(options);
  const x402 = methods.find((method) => method.type === "x402");
  return {
    schema: "https://caravel.dev/schemas/products/v1.json",
    name: catalog.source.title,
    source: catalog.source.location,
    generatedAt: new Date().toISOString(),
    access: methods,
    products: catalog.products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      method: product.method,
      path: product.path,
      price: x402?.pricing.type === "fixed" ? { amount: Number(options.x402Price), currency: "USD", unit: "request", provenance: "configuration" } : product.offer,
      access: methods.map((method) => method.type),
    })),
  };
}

function fernGeneratorsConfig() {
  return `# yaml-language-server: $schema=https://schema.buildwithfern.dev/generators-yml.json\napi:\n  specs:\n    - openapi: ./definition/openapi.json\ndefault-group: local\ngroups:\n  local:\n    generators:\n      - name: fern-typescript-sdk\n        version: 3.87.3\n        output:\n          location: local-file-system\n          path: ../sdk/typescript\n      - name: fern-python-sdk\n        version: 5.28.0\n        output:\n          location: local-file-system\n          path: ../sdk/python\n`;
}

function fernCliConfig() {
  return `${JSON.stringify({ version: "5.95.0", organization: "caravel" }, null, 2)}\n`;
}

function overviewDoc(catalog, manifest) {
  const x402 = manifest.access.find((method) => method.type === "x402");
  return `---\ntitle: ${catalog.source.title}\ndescription: ${catalog.products.length} API products prepared by Caravel.\n---\n\n# ${catalog.source.title}\n\nCaravel imported ${catalog.products.length} operations from [the source API](${catalog.source.location}).\n\n## Access\n\n${manifest.access.map((method) => method.type === "api-key" ? `- API key in the \`${method.header}\` header.` : `- x402 payment using ${method.pricing.type === "fixed" ? method.pricing.price : "each product's listed price"} on \`${method.network}\`.`).join("\n")}\n${x402 ? `\nPayments go to \`${x402.payTo}\`.` : ""}\n\n## SDKs\n\nThe generated Fern config targets TypeScript and Python SDKs. Run \`fern generate --group local --local\` from \`.caravel/generated/fern\`. Docker or Podman is required.\n`;
}

function endpointsDoc(catalog) {
  return `---\ntitle: Endpoints\ndescription: Imported API products.\n---\n\n# Endpoints\n\n${catalog.products.map((product) => `## ${product.name}\n\n\`${product.method} ${product.path}\`\n\n${product.description || "No source description was provided."}\n\n${product.offer ? `Price: ${product.offer.amount} ${product.offer.currency} per ${product.offer.unit}.` : "Price: not configured."}`).join("\n\n")}\n`;
}

function accessWrapper(manifest) {
  const apiKey = manifest.access.find((method) => method.type === "api-key");
  const x402 = manifest.access.find((method) => method.type === "x402");
  const prices = Object.fromEntries(manifest.products.filter((product) => product.price?.amount).map((product) => [product.path, `$${Number(product.price.amount).toFixed(3)}`]));
  return `import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";\nimport { ExactEvmScheme } from "@x402/evm/exact/server";\nimport { withX402 } from "@x402/next";\n\nconst apiKeyHeader = ${JSON.stringify(apiKey?.header ?? null)};\nconst acceptedKeys = new Set((process.env.CARAVEL_API_KEYS ?? "").split(",").map(value => value.trim()).filter(Boolean));\nconst prices = ${JSON.stringify(prices, null, 2)};\n\nexport function withCaravelAccess(handler) {\n${x402 ? `  const facilitator = new HTTPFacilitatorClient({ url: process.env.X402_FACILITATOR_URL });\n  const server = new x402ResourceServer(facilitator);\n  server.register(${JSON.stringify(x402.network)}, new ExactEvmScheme());\n  return async request => {\n    if (apiKeyHeader && acceptedKeys.has(request.headers.get(apiKeyHeader) ?? "")) return handler(request);\n    const path = new URL(request.url).pathname;\n    const price = prices[path];\n    if (!price) return Response.json({ error: "No x402 price is configured for this endpoint." }, { status: 503 });\n    return withX402(handler, { accepts: { scheme: "exact", price, network: ${JSON.stringify(x402.network)}, payTo: ${JSON.stringify(x402.payTo)} } }, server)(request);\n  };` : `  return async request => {\n    if (!apiKeyHeader || !acceptedKeys.has(request.headers.get(apiKeyHeader) ?? "")) return Response.json({ error: "A valid API key is required." }, { status: 401 });\n    return handler(request);\n  };`}\n}\n`;
}

async function loadOpenApi(catalog) {
  const location = catalog.source.location;
  if (/^https?:\/\//i.test(location)) {
    const response = await fetch(location, { headers: { Accept: "application/json", "User-Agent": "Caravel/0.1" }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`${location} returned HTTP ${response.status}.`);
    return response.json();
  }
  return JSON.parse(await readFile(location, "utf8"));
}

export async function buildApiProduct(root = process.cwd(), options = {}) {
  const workspace = workspacePath(root);
  const catalog = JSON.parse(await readFile(resolve(workspace, "catalog.json"), "utf8"));
  if (catalog.source.type !== "openapi") throw new Error("Caravel build currently supports OpenAPI sources.");
  const manifest = createProductManifest(catalog, options);
  const openapi = await loadOpenApi(catalog);
  const output = resolve(workspace, "generated");
  await Promise.all([
    mkdir(resolve(output, "fern", "definition"), { recursive: true }),
    mkdir(resolve(output, "docs"), { recursive: true }),
    mkdir(resolve(output, "access"), { recursive: true }),
    mkdir(resolve(output, ".well-known"), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(resolve(output, "fern", "definition", "openapi.json"), `${JSON.stringify(openapi, null, 2)}\n`),
    writeFile(resolve(output, "fern", "generators.yml"), fernGeneratorsConfig()),
    writeFile(resolve(output, "fern", "fern.config.json"), fernCliConfig()),
    writeFile(resolve(output, "docs", "index.mdx"), overviewDoc(catalog, manifest)),
    writeFile(resolve(output, "docs", "endpoints.mdx"), endpointsDoc(catalog)),
    writeFile(resolve(output, "docs", "meta.json"), `${JSON.stringify({ title: catalog.source.title, pages: ["index", "endpoints"] }, null, 2)}\n`),
    writeFile(resolve(output, "access", "next.ts"), accessWrapper(manifest)),
    writeFile(resolve(output, ".well-known", "caravel.json"), `${JSON.stringify(manifest, null, 2)}\n`),
  ]);
  return { output, manifest, files: ["fern/definition/openapi.json", "fern/generators.yml", "fern/fern.config.json", "docs/index.mdx", "docs/endpoints.mdx", "access/next.ts", ".well-known/caravel.json"] };
}

export function formatBuildResult(result) {
  return ["Caravel product build", "", ...result.files.map((file) => `✓ ${file}`), "", `Output: ${result.output}`].join("\n");
}
