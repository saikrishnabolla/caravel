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
      facilitatorUrl: options.x402FacilitatorUrl,
      asset: options.x402Asset,
      assetName: options.x402AssetName,
      assetVersion: options.x402AssetVersion,
      decimals: options.x402Decimals,
      rpcUrl: options.x402RpcUrl,
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
    upstreamBaseUrl: options.upstreamBaseUrl,
    upstreamAuth: options.upstreamAuth ?? { type: "none" },
    gatewayBasePath: "/api/caravel",
    generatedAt: new Date().toISOString(),
    access: methods,
    products: catalog.products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      method: product.method,
      path: product.path,
      endpoint: `/api/caravel${product.path}`,
      price: x402?.pricing.type === "fixed" ? { amount: Number(options.x402Price), currency: "USD", unit: "request", provenance: "configuration" } : product.offer,
      access: methods.map((method) => method.type),
    })),
  };
}

function createA2AAgentCard(catalog, manifest) {
  return {
    name: `${catalog.source.title} Seller Agent`,
    description: `Provides ${catalog.products.length} API products through Caravel.`,
    supportedInterfaces: [],
    provider: { organization: catalog.source.title, url: manifest.gatewayBasePath },
    version: "1.0.0",
    capabilities: { streaming: false, pushNotifications: false, extensions: [], extendedAgentCard: false },
    securitySchemes: {},
    securityRequirements: [],
    defaultInputModes: ["application/json"],
    defaultOutputModes: ["application/json"],
    skills: catalog.products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description || `${product.method} ${product.path}`,
      tags: ["api", "commerce", product.method.toLowerCase()],
      examples: [`Call ${manifest.gatewayBasePath}${product.path}`],
      inputModes: ["application/json"],
      outputModes: ["application/json"],
      securityRequirements: [],
    })),
    documentationUrl: "/docs",
    signatures: [],
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

function docsLayout() {
  return `import type { ReactNode } from "react";\nimport type { Root } from "fumadocs-core/page-tree";\nimport { DocsLayout } from "fumadocs-ui/layouts/docs";\nimport { RootProvider } from "fumadocs-ui/provider/next";\nimport "fumadocs-ui/style.css";\n\nconst tree: Root = { name: "API", children: [{ type: "page", name: "Overview", url: "/caravel-docs" }, { type: "page", name: "Endpoints", url: "/caravel-docs/endpoints" }] };\n\nexport default function Layout({ children }: { children: ReactNode }) {\n  return <RootProvider><DocsLayout tree={tree} nav={{ title: "API" }}>{children}</DocsLayout></RootProvider>;\n}\n`;
}

function docsPage(title, description, body) {
  return `import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";\n\nexport default function Page() {\n  return <DocsPage><DocsTitle>${title.replaceAll('"', '\\"')}</DocsTitle><DocsDescription>${description.replaceAll('"', '\\"')}</DocsDescription><DocsBody>${body}</DocsBody></DocsPage>;\n}\n`;
}

function overviewPage(catalog, manifest) {
  const access = manifest.access.map(method => method.type === "api-key" ? `API key: ${method.header}` : `x402: ${method.network}`).join(" · ");
  return docsPage(catalog.source.title, `${catalog.products.length} API products prepared by Caravel.`, `<h2>Access</h2><p>${access}</p><h2>Discovery</h2><p><code>/.well-known/caravel.json</code> and <code>/.well-known/agent-card.json</code></p>`);
}

function endpointsPage(catalog) {
  const rows = catalog.products.map(product => `<li><code>${product.method} ${product.path}</code> ${product.name}</li>`).join("");
  return docsPage("Endpoints", "Published API products.", `<ul>${rows}</ul>`);
}

function accessWrapper(manifest) {
  const apiKey = manifest.access.find((method) => method.type === "api-key");
  const x402 = manifest.access.find((method) => method.type === "x402");
  const imports = x402 ? `import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";\nimport { ExactEvmScheme } from "@x402/evm/exact/server";\nimport { bazaarResourceServerExtension, declareDiscoveryExtension } from "@x402/extensions/bazaar";\nimport { withX402 } from "@x402/next";\n` : "";
  const moneyParser = x402?.asset ? `  scheme.registerMoneyParser(async (amount, network) => network === ${JSON.stringify(x402.network)} ? { amount: Math.floor(amount * ${10 ** Number(x402.decimals ?? 6)}).toString(), asset: ${JSON.stringify(x402.asset)}, extra: { name: ${JSON.stringify(x402.assetName ?? "USDC")}, version: ${JSON.stringify(x402.assetVersion ?? "2")} } } : null);\n` : "";
  const server = x402 ? `let resourceServer: x402ResourceServer | undefined;\n\nfunction getResourceServer() {\n  if (resourceServer) return resourceServer;\n  const url = process.env.X402_FACILITATOR_URL ?? ${JSON.stringify(x402.facilitatorUrl ?? null)};\n  if (!url) throw new Error("X402_FACILITATOR_URL is required for x402 access.");\n  resourceServer = new x402ResourceServer(new HTTPFacilitatorClient({ url }));\n  const scheme = new ExactEvmScheme();\n${moneyParser}  resourceServer.register(${JSON.stringify(x402.network)}, scheme);\n  resourceServer.registerExtension(bazaarResourceServerExtension);\n  return resourceServer;\n}\n\n` : "";
  const protection = x402 ? `    if (!product.price) return NextResponse.json({ error: "No x402 price is configured for this endpoint." }, { status: 503 });\n    const extensions = declareDiscoveryExtension({ output: { example: {} } });\n    return withX402(handler, { accepts: { scheme: "exact", price: product.price, network: ${JSON.stringify(x402.network)}, payTo: ${JSON.stringify(x402.payTo)} }, description: product.description, extensions }, getResourceServer())(request);` : `    return NextResponse.json({ error: "A valid API key is required." }, { status: 401 });`;
  return `${imports}import { NextResponse, type NextRequest } from "next/server";\n\ntype ProductAccess = { price: string | null; description: string };\ntype RouteHandler = (request: NextRequest) => Promise<NextResponse>;\n\nconst apiKeyHeader = ${JSON.stringify(apiKey?.header ?? null)};\nconst acceptedKeys = new Set((process.env.CARAVEL_API_KEYS ?? "").split(",").map(value => value.trim()).filter(Boolean));\n\nfunction hasApiKey(request: NextRequest) {\n  return Boolean(apiKeyHeader && acceptedKeys.has(request.headers.get(apiKeyHeader) ?? ""));\n}\n\n${server}export function withCaravelAccess(handler: RouteHandler, product: ProductAccess) {\n  return async (request: NextRequest) => {\n    if (hasApiKey(request)) return handler(request);\n${protection}\n  };\n}\n`;
}

function gatewayRoute(manifest) {
  const operations = Object.fromEntries(manifest.products.map((product) => [`${product.method} ${product.path}`, {
    upstreamPath: product.path,
    price: product.price?.amount ? `$${Number(product.price.amount).toFixed(3)}` : null,
    description: product.description || product.name,
  }]));
  return [
    'import { NextResponse, type NextRequest } from "next/server";',
    'import { withCaravelAccess } from "../../../../../lib/caravel-access";',
    "",
    `const upstreamBaseUrl = ${JSON.stringify(manifest.upstreamBaseUrl)};`,
    'type UpstreamAuth = { type: "none" } | { type: "bearer"; environmentVariable: string } | { type: "header"; header: string; environmentVariable: string };',
    `const upstreamAuth: UpstreamAuth = ${JSON.stringify(manifest.upstreamAuth ?? { type: "none" })};`,
    `const operations: Record<string, { upstreamPath: string; price: string | null; description: string }> = ${JSON.stringify(operations, null, 2)};`,
    "",
    "function createHandler(method: string) {",
    "  return async function gateway(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {",
    "    const { path } = await context.params;",
    '    const upstreamPath = "/" + path.join("/");',
    '    const product = operations[method + " " + upstreamPath];',
    '    if (!product) return NextResponse.json({ error: "This API product is not published." }, { status: 404 });',
    "    const forward = async (paidRequest: NextRequest) => {",
    "      const target = new URL(product.upstreamPath, upstreamBaseUrl);",
    "      target.search = new URL(paidRequest.url).search;",
    "      const headers = new Headers(paidRequest.headers);",
    '      headers.delete("host");',
    '      headers.delete("x-api-key");',
    '      if (upstreamAuth.type === "bearer") {',
    '        const token = process.env[upstreamAuth.environmentVariable];',
    '        if (!token) return NextResponse.json({ error: "Upstream bearer credential is missing." }, { status: 503 });',
    '        headers.set("authorization", "Bearer " + token);',
    '      } else if (upstreamAuth.type === "header") {',
    '        const value = process.env[upstreamAuth.environmentVariable];',
    '        if (!value) return NextResponse.json({ error: "Upstream credential is missing." }, { status: 503 });',
    '        headers.set(upstreamAuth.header, value);',
    '      }',
    '      const body = method === "GET" || method === "HEAD" ? undefined : await paidRequest.arrayBuffer();',
    '      const response = await fetch(target, { method, headers, body, redirect: "manual" });',
    "      return new NextResponse(response.body, { status: response.status, headers: response.headers });",
    "    };",
    "    return withCaravelAccess(forward, product)(request);",
    "  };",
    "}",
    "",
    'export const GET = createHandler("GET");',
    'export const POST = createHandler("POST");',
    'export const PUT = createHandler("PUT");',
    'export const PATCH = createHandler("PATCH");',
    'export const DELETE = createHandler("DELETE");',
    'export const HEAD = createHandler("HEAD");',
    "",
  ].join("\n");
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
  const openapi = await loadOpenApi(catalog);
  let saved = {};
  try { saved = JSON.parse(await readFile(resolve(workspace, "config.json"), "utf8")).product ?? {}; } catch {}
  const fallbackBase = /^https?:\/\//i.test(catalog.source.location) ? new URL(catalog.source.location).origin : "http://localhost:3000";
  const upstreamBaseUrl = options.upstreamBaseUrl ?? saved.upstreamBaseUrl ?? openapi.servers?.[0]?.url ?? fallbackBase;
  const savedX402 = saved.x402 ?? {};
  const manifest = createProductManifest(catalog, {
    ...options,
    apiKey: options.apiKey ?? Boolean(saved.apiKey ?? true),
    apiKeyHeader: options.apiKeyHeader ?? saved.apiKey?.header,
    x402PayTo: options.x402PayTo ?? savedX402.payTo,
    x402Price: options.x402Price ?? savedX402.price,
    x402Network: options.x402Network ?? savedX402.network,
    x402FacilitatorUrl: options.x402FacilitatorUrl ?? savedX402.facilitatorUrl,
    x402Asset: options.x402Asset ?? savedX402.asset,
    x402AssetName: options.x402AssetName ?? savedX402.assetName,
    x402AssetVersion: options.x402AssetVersion ?? savedX402.assetVersion,
    x402Decimals: options.x402Decimals ?? savedX402.decimals,
    x402RpcUrl: options.x402RpcUrl ?? savedX402.rpcUrl,
    upstreamAuth: options.upstreamAuth ?? saved.upstreamAuth,
    upstreamBaseUrl,
  });
  const output = resolve(workspace, "generated");
  const agentCard = createA2AAgentCard(catalog, manifest);
  await Promise.all([
    mkdir(resolve(output, "fern", "definition"), { recursive: true }),
    mkdir(resolve(output, "docs"), { recursive: true }),
    mkdir(resolve(output, "docs-app", "endpoints"), { recursive: true }),
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
    writeFile(resolve(output, "docs-app", "layout.tsx"), docsLayout()),
    writeFile(resolve(output, "docs-app", "page.tsx"), overviewPage(catalog, manifest)),
    writeFile(resolve(output, "docs-app", "endpoints", "page.tsx"), endpointsPage(catalog)),
    writeFile(resolve(output, "access", "next.ts"), accessWrapper(manifest)),
    writeFile(resolve(output, "access", "gateway-route.ts"), gatewayRoute(manifest)),
    writeFile(resolve(output, ".well-known", "caravel.json"), `${JSON.stringify(manifest, null, 2)}\n`),
    writeFile(resolve(output, ".well-known", "agent-card.json"), `${JSON.stringify(agentCard, null, 2)}\n`),
  ]);
  return { output, manifest, files: ["fern/definition/openapi.json", "fern/generators.yml", "fern/fern.config.json", "docs/index.mdx", "docs/endpoints.mdx", "docs-app/layout.tsx", "docs-app/page.tsx", "docs-app/endpoints/page.tsx", "access/next.ts", "access/gateway-route.ts", ".well-known/caravel.json", ".well-known/agent-card.json"] };
}

export function formatBuildResult(result) {
  return ["Caravel product build", "", ...result.files.map((file) => `✓ ${file}`), "", `Output: ${result.output}`].join("\n");
}
