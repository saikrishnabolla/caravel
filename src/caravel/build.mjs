import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { workspacePath } from "./workspace.mjs";
import { ensureEditorialWorkspace } from "./editorial.mjs";

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

const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete", "head", "options", "trace"]);

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "operation";
}

function resolveReference(document, value) {
  if (!value?.$ref?.startsWith("#/")) return value;
  return value.$ref
    .slice(2)
    .split("/")
    .map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce((current, part) => current?.[part], document) ?? value;
}

function schemaLabel(schema, document) {
  if (!schema) return "unknown";
  if (schema.$ref) return schema.$ref.split("/").at(-1) ?? "object";
  const resolved = resolveReference(document, schema);
  if (resolved.enum) return resolved.enum.map(String).join(" | ");
  if (resolved.type === "array") return `${schemaLabel(resolved.items, document)}[]`;
  if (Array.isArray(resolved.type)) return resolved.type.join(" | ");
  return resolved.type ?? (resolved.properties ? "object" : "unknown");
}

function exampleForSchema(schema, document, depth = 0) {
  if (!schema || depth > 4) return null;
  const resolved = resolveReference(document, schema);
  if (resolved.example !== undefined) return resolved.example;
  if (resolved.default !== undefined) return resolved.default;
  if (resolved.enum?.length) return resolved.enum[0];
  if (resolved.type === "object" || resolved.properties) {
    return Object.fromEntries(Object.entries(resolved.properties ?? {}).map(([name, property]) => [name, exampleForSchema(property, document, depth + 1)]));
  }
  if (resolved.type === "array") return [exampleForSchema(resolved.items, document, depth + 1)];
  if (resolved.type === "integer" || resolved.type === "number") return resolved.minimum ?? 0;
  if (resolved.type === "boolean") return true;
  if (resolved.format === "date-time") return "2026-08-13T16:00:00Z";
  if (resolved.format === "date") return "2026-08-13";
  return resolved.pattern ? "value" : "string";
}

function normalizeParameter(parameter, document) {
  const resolved = resolveReference(document, parameter);
  const schema = resolveReference(document, resolved.schema ?? {});
  return {
    name: resolved.name ?? "parameter",
    in: resolved.in ?? "query",
    required: Boolean(resolved.required),
    description: resolved.description ?? "",
    type: schemaLabel(resolved.schema, document),
    example: resolved.example ?? schema.example ?? schema.default ?? exampleForSchema(resolved.schema, document),
  };
}

function preferredContent(content = {}) {
  const type = Object.keys(content).find((key) => key === "application/json") ?? Object.keys(content)[0];
  return type ? { type, value: content[type] } : null;
}

function buildDocumentationModel(openapi, catalog, manifest, editorial, snippets) {
  const declaredTags = new Map((openapi.tags ?? []).map((tag) => [tag.name, tag.description ?? ""]));
  const operationByPointer = new Map(catalog.products.map((product) => [product.source.pointer, product]));
  const operations = [];

  for (const [path, pathItem] of Object.entries(openapi.paths ?? {})) {
    const sharedParameters = pathItem.parameters ?? [];
    for (const [method, rawOperation] of Object.entries(pathItem ?? {})) {
      if (!HTTP_METHODS.has(method.toLowerCase())) continue;
      const pointer = `#/paths/${path.replaceAll("~", "~0").replaceAll("/", "~1")}/${method}`;
      const product = operationByPointer.get(pointer);
      const operation = resolveReference(openapi, rawOperation);
      const tag = operation.tags?.[0] ?? "Other";
      const parameters = [...sharedParameters, ...(operation.parameters ?? [])].map((parameter) => normalizeParameter(parameter, openapi));
      const requestContent = preferredContent(operation.requestBody?.content);
      const requestSchema = requestContent?.value?.schema;
      const requestExample = requestContent?.value?.example ?? exampleForSchema(requestSchema, openapi);
      const responses = Object.entries(operation.responses ?? {}).map(([status, rawResponse]) => {
        const response = resolveReference(openapi, rawResponse);
        const content = preferredContent(response.content);
        return {
          status,
          description: response.description ?? "Response",
          contentType: content?.type ?? null,
          schema: schemaLabel(content?.value?.schema, openapi),
          example: content?.value?.example ?? exampleForSchema(content?.value?.schema, openapi),
        };
      });
      const operationSlug = slug(operation.operationId ?? product?.id ?? `${method}-${path}`);
      const query = parameters
        .filter((parameter) => parameter.in === "query" && parameter.example !== null && parameter.example !== undefined)
        .map((parameter) => `${encodeURIComponent(parameter.name)}=${encodeURIComponent(String(parameter.example))}`)
        .join("&");
      const gatewayPath = `/api/caravel${path}${query ? `?${query}` : ""}`;
      const apiKey = manifest.access.find((access) => access.type === "api-key");
      const curlParts = [`curl --request ${method.toUpperCase()} \\\n  --url 'http://localhost:3000${gatewayPath}'`];
      if (apiKey) curlParts.push(`  --header '${apiKey.header}: YOUR_API_KEY'`);
      if (requestContent) curlParts.push(`  --header 'Content-Type: ${requestContent.type}'`);
      if (requestExample !== null && requestExample !== undefined) curlParts.push(`  --data '${JSON.stringify(requestExample)}'`);

      const guide = editorial.guides.find((candidate) => candidate.operationId === (operation.operationId ?? product?.id));
      operations.push({
        id: operation.operationId ?? product?.id ?? operationSlug,
        slug: operationSlug,
        tag,
        name: operation.summary ?? product?.name ?? `${method.toUpperCase()} ${path}`,
        summary: operation.summary ?? "",
        description: operation.description ?? product?.description ?? "",
        method: method.toUpperCase(),
        path,
        gatewayPath: `/api/caravel${path}`,
        deprecated: Boolean(operation.deprecated),
        parameters,
        requestBody: requestContent ? {
          required: Boolean(operation.requestBody?.required),
          contentType: requestContent.type,
          schema: schemaLabel(requestSchema, openapi),
          example: requestExample,
        } : null,
        responses,
        price: product?.offer ?? null,
        curl: curlParts.join(" \\\n"),
        guide: guide ?? null,
        snippets: snippets.snippets.filter((snippet) => snippet.operationId === (operation.operationId ?? product?.id)),
      });
      if (!declaredTags.has(tag)) declaredTags.set(tag, "");
    }
  }

  return {
    title: openapi.info?.title ?? catalog.source.title,
    version: openapi.info?.version ?? "",
    description: openapi.info?.description ?? "",
    source: catalog.source.location,
    server: manifest.upstreamBaseUrl,
    access: manifest.access,
    tags: [...declaredTags].map(([name, description]) => ({
      name,
      slug: slug(name),
      description,
      operations: operations.filter((operation) => operation.tag === name).map((operation) => operation.slug),
    })).filter((tag) => tag.operations.length > 0),
    operations,
  };
}

function publicOpenApi(openapi, manifest) {
  const apiKey = manifest.access.find((method) => method.type === "api-key");
  const paths = Object.fromEntries(Object.entries(openapi.paths ?? {}).map(([path, pathItem]) => [`/api/caravel${path}`, pathItem]));
  const securitySchemes = { ...(openapi.components?.securitySchemes ?? {}) };
  if (apiKey) securitySchemes.CaravelApiKey = { type: "apiKey", in: "header", name: apiKey.header };
  const security = apiKey ? [{ CaravelApiKey: [] }] : openapi.security;
  return {
    ...openapi,
    info: {
      ...openapi.info,
      description: `${openapi.info?.description ?? ""}\n\nThis generated specification targets the Caravel gateway.`.trim(),
    },
    servers: [{ url: "/", description: "Caravel gateway" }],
    paths,
    components: { ...(openapi.components ?? {}), securitySchemes },
    ...(security ? { security } : {}),
    "x-caravel-source": manifest.source,
    "x-caravel-access": manifest.access,
  };
}

function overviewDoc(catalog, manifest) {
  const x402 = manifest.access.find((method) => method.type === "x402");
  return `---\ntitle: ${catalog.source.title}\ndescription: ${catalog.products.length} API products prepared by Caravel.\n---\n\n# ${catalog.source.title}\n\nCaravel imported ${catalog.products.length} operations from [the source API](${catalog.source.location}).\n\n## Access\n\n${manifest.access.map((method) => method.type === "api-key" ? `- API key in the \`${method.header}\` header.` : `- x402 payment using ${method.pricing.type === "fixed" ? method.pricing.price : "each product's listed price"} on \`${method.network}\`.`).join("\n")}\n${x402 ? `\nPayments go to \`${x402.payTo}\`.` : ""}\n\n## SDKs\n\nThe generated Fern config targets TypeScript and Python SDKs. Run \`fern generate --group local --local\` from \`.caravel/generated/fern\`. Docker or Podman is required.\n`;
}

function endpointsDoc(catalog) {
  return `---\ntitle: Endpoints\ndescription: Imported API products.\n---\n\n# Endpoints\n\n${catalog.products.map((product) => `## ${product.name}\n\n\`${product.method} ${product.path}\`\n\n${product.description || "No source description was provided."}\n\n${product.offer ? `Price: ${product.offer.amount} ${product.offer.currency} per ${product.offer.unit}.` : "Price: not configured."}`).join("\n\n")}\n`;
}

function docsData(documentation, openapi) {
  return `export const apiDocumentation = ${JSON.stringify(documentation, null, 2)} as const;\n\nexport const openApiDocument = ${JSON.stringify(openapi, null, 2)} as const;\n\nexport type ApiOperation = (typeof apiDocumentation.operations)[number];\n`;
}

function docsLayout(documentation) {
  const groups = documentation.tags.map((tag) => ({
    type: "folder",
    name: tag.name,
    defaultOpen: true,
    children: tag.operations.map((operationSlug) => {
      const operation = documentation.operations.find((candidate) => candidate.slug === operationSlug);
      return { type: "page", name: operation?.name ?? operationSlug, url: `/caravel-docs/reference/${operationSlug}` };
    }),
  }));
  const guideGroups = documentation.tags.map((tag) => ({
    type: "folder",
    name: tag.name,
    defaultOpen: true,
    children: tag.operations.map((operationSlug) => {
      const operation = documentation.operations.find((candidate) => candidate.slug === operationSlug);
      return { type: "page", name: operation?.name ?? operationSlug, url: `/caravel-docs/guides/${operationSlug}` };
    }),
  }));
  const embedGroups = documentation.tags.map((tag) => ({
    type: "folder",
    name: tag.name,
    defaultOpen: true,
    children: tag.operations.map((operationSlug) => {
      const operation = documentation.operations.find((candidate) => candidate.slug === operationSlug);
      return { type: "page", name: operation?.name ?? operationSlug, url: `/caravel-docs/snippets#${operationSlug}` };
    }),
  }));
  const tree = {
    name: documentation.title,
    children: [
      { type: "folder", name: "Guides", root: true, defaultOpen: true, index: { type: "page", name: "Overview", url: "/caravel-docs" }, children: [
        { type: "page", name: "Overview", url: "/caravel-docs" },
        { type: "folder", name: "Get started", defaultOpen: true, children: [
          { type: "page", name: "Quickstart", url: "/caravel-docs/quickstart" },
          { type: "page", name: "Authentication", url: "/caravel-docs/authentication" },
        ] },
        ...guideGroups,
      ] },
      { type: "folder", name: "API Reference", root: true, defaultOpen: true, index: { type: "page", name: "Reference overview", url: "/caravel-docs/reference" }, children: [
        { type: "page", name: "Reference overview", url: "/caravel-docs/reference" },
        ...groups,
        { type: "page", name: "OpenAPI specification", url: "/caravel-docs/openapi" },
      ] },
      { type: "folder", name: "SDKs", root: true, defaultOpen: true, index: { type: "page", name: "SDKs", url: "/caravel-docs/sdks" }, children: [
        { type: "page", name: "SDKs", url: "/caravel-docs/sdks" },
      ] },
      { type: "folder", name: "Embeds", root: true, defaultOpen: true, index: { type: "page", name: "Embeds", url: "/caravel-docs/snippets" }, children: [
        { type: "page", name: "Overview", url: "/caravel-docs/snippets" },
        ...embedGroups,
      ] },
    ],
  };
  return `import type { ReactNode } from "react";\nimport type { Root } from "fumadocs-core/page-tree";\nimport { DocsLayout } from "fumadocs-ui/layouts/docs";\nimport { RootProvider } from "fumadocs-ui/provider/next";\nimport "fumadocs-ui/style.css";\nimport "./caravel-docs.css";\n\nconst tree = ${JSON.stringify(tree, null, 2)} as unknown as Root;\n\nexport default function Layout({ children }: { children: ReactNode }) {\n  return <RootProvider><DocsLayout tree={tree} tabMode="top" nav={{ title: ${JSON.stringify(documentation.title)} }}>${"{children}"}</DocsLayout></RootProvider>;\n}\n`;
}

function docsPage(title, description, body) {
  return `import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";\n\nexport default function Page() {\n  return <DocsPage><DocsTitle>${title.replaceAll('"', '\\"')}</DocsTitle><DocsDescription>${description.replaceAll('"', '\\"')}</DocsDescription><DocsBody>${body}</DocsBody></DocsPage>;\n}\n`;
}

function overviewPage(catalog, manifest, documentation) {
  const access = manifest.access.map(method => method.type === "api-key" ? `API key: ${method.header}` : `x402: ${method.network}`).join(" · ");
  const groups = documentation.tags.map((tag) => `<li><a href="/caravel-docs/reference">${tag.name}</a> — ${tag.description || `${tag.operations.length} operations`}</li>`).join("");
  return docsPage(catalog.source.title, documentation.description || `${catalog.products.length} API operations.`, `<p>${documentation.description}</p><h2>What you can build</h2><ul>${groups}</ul><h2>Access</h2><p>${access}</p><h2>Start making requests</h2><p>Follow the <a href="/caravel-docs/quickstart">quickstart</a>, or browse the <a href="/caravel-docs/reference">API reference</a>.</p><h2>Agent discovery</h2><p><code>/.well-known/caravel.json</code> describes the published products. <code>/.well-known/agent-card.json</code> exposes the A2A Agent Card.</p>`);
}

function endpointsPage(catalog) {
  const rows = catalog.products.map(product => `<li><code>${product.method} ${product.path}</code> ${product.name}</li>`).join("");
  return docsPage("Endpoints", "Published API products.", `<ul>${rows}</ul>`);
}

function quickstartPage(documentation, manifest) {
  const example = documentation.operations[0];
  const header = manifest.access.find((method) => method.type === "api-key")?.header ?? "X-API-Key";
  return `import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";\nimport { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";\n\nexport default async function Page() {\n  return <DocsPage><DocsTitle>Quickstart</DocsTitle><DocsDescription>Make your first request through the Caravel gateway.</DocsDescription><DocsBody><h2>1. Set an API key</h2><p>Set <code>CARAVEL_API_KEYS</code> in the application environment. Multiple keys can be separated with commas.</p>{await ServerCodeBlock({ lang: "bash", code: "CARAVEL_API_KEYS=your-local-key npm run dev" })}<h2>2. Call an endpoint</h2><p>Send the key in the <code>${header}</code> header.</p>{await ServerCodeBlock({ lang: "bash", code: ${JSON.stringify(example?.curl ?? "curl http://localhost:3000/api/caravel")} })}<h2>3. Handle the response</h2><p>A valid request is proxied to the configured upstream API. Missing or invalid credentials return <code>401</code>.</p><p>Continue to the <a href="/caravel-docs/reference/${example?.slug ?? ""}">${example?.name ?? "API reference"}</a> page for parameters and response details.</p></DocsBody></DocsPage>;\n}\n`;
}

function authenticationPage(manifest) {
  const apiKey = manifest.access.find((method) => method.type === "api-key");
  const x402 = manifest.access.find((method) => method.type === "x402");
  const sections = [apiKey ? `<h2>API key</h2><p>Pass the key in the <code>${apiKey.header}</code> request header. Server-side keys are read from <code>${apiKey.environmentVariable}</code>.</p>` : "", x402 ? `<h2>x402 payment</h2><p>Paid requests use the <code>${x402.scheme}</code> scheme on <code>${x402.network}</code>. ${x402.pricing.type === "fixed" ? `The configured request price is ${x402.pricing.price}.` : "Each endpoint uses its published price."}</p>` : ""].join("");
  return docsPage("Authentication", "How clients gain access to this API.", `${sections}<h2>Errors</h2><ul><li><code>401</code>: the API key is missing or invalid.</li><li><code>402</code>: payment is required when x402 access is enabled.</li><li><code>503</code>: an upstream or payment credential is not configured.</li></ul>`);
}

function sdksPage() {
  return `import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";\nimport { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";\n\nexport default async function Page() {\n  return <DocsPage><DocsTitle>SDKs</DocsTitle><DocsDescription>Generate TypeScript and Python clients from the same published Caravel specification.</DocsDescription><DocsBody><p>Caravel configures Fern to generate local SDKs without requiring a hosted Fern project. The generated clients target the Caravel gateway, including its API-key access layer.</p><h2>Generate</h2>{await ServerCodeBlock({ lang: "bash", code: "node bin/caravel.mjs generate" })}<p>Docker or Podman is required by the local Fern generator.</p><h2>Output</h2><ul><li><code>.caravel/generated/sdk/typescript</code></li><li><code>.caravel/generated/sdk/python</code></li></ul><h2>Source specification</h2><p>Both SDKs use <a href="/caravel-openapi.json">the published Caravel OpenAPI specification</a>, not the private upstream URL.</p></DocsBody></DocsPage>;\n}\n`;
}

function referenceOverviewPage(documentation) {
  const groups = documentation.tags.map((tag) => `<section><h2>${tag.name}</h2><p>${tag.description}</p><ul>${tag.operations.map((operationSlug) => { const operation = documentation.operations.find((candidate) => candidate.slug === operationSlug); return `<li><a href="/caravel-docs/reference/${operationSlug}"><code>${operation?.method}</code> ${operation?.name}</a><br/>${operation?.description ?? ""}</li>`; }).join("")}</ul></section>`).join("");
  return docsPage("API reference", `${documentation.operations.length} operations organized by capability.`, groups);
}

function guidePage() {
  return `import { notFound } from "next/navigation";\nimport { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";\nimport { Callout } from "fumadocs-ui/components/callout";\nimport { apiDocumentation } from "../../api-docs";\n\nexport function generateStaticParams() { return apiDocumentation.operations.map((operation) => ({ operation: operation.slug })); }\n\nexport default async function Page({ params }: { params: Promise<{ operation: string }> }) {\n  const { operation: operationSlug } = await params;\n  const operation = apiDocumentation.operations.find((candidate) => candidate.slug === operationSlug);\n  if (!operation) notFound();\n  const guide = operation.guide;\n  return <DocsPage><DocsTitle>{guide?.title ?? operation.name}</DocsTitle><DocsDescription>{guide?.overview ?? operation.description}</DocsDescription><DocsBody>\n    {guide?.provenance === "source-derived" ? <Callout type="info" title="Editable draft">This guide was derived from the OpenAPI source. Review and edit it with Caravel before publishing.</Callout> : null}\n    <h2>When to use this endpoint</h2><ul>{guide?.useCases.map((item) => <li key={item}>{item}</li>)}</ul>\n    <h2>How it works</h2><ol>{guide?.workflow.map((item) => <li key={item}>{item}</li>)}</ol>\n    <h2>Implementation details</h2><p>Call <code>{operation.method} {operation.gatewayPath}</code>. See the <a href={"/caravel-docs/reference/" + operation.slug}>API reference</a> for exact parameters, schemas, and responses.</p>\n    {guide?.notes.length ? <><h2>Notes</h2><ul>{guide.notes.map((note) => <li key={note}>{note}</li>)}</ul></> : null}\n  </DocsBody></DocsPage>;\n}\n`;
}

function requestTester() {
  return `"use client";\n\nimport { useMemo, useState } from "react";\n\ntype Parameter = { name: string; in: string; required: boolean; example: unknown };\ntype Props = { method: string; path: string; parameters: readonly Parameter[]; requestExample?: unknown; apiKeyHeader?: string };\n\nexport function RequestTester({ method, path, parameters, requestExample, apiKeyHeader = "X-API-Key" }: Props) {\n  const initial = useMemo(() => Object.fromEntries(parameters.map((parameter) => [parameter.name, parameter.example == null ? "" : String(parameter.example)])), [parameters]);\n  const [values, setValues] = useState<Record<string, string>>(initial);\n  const [apiKey, setApiKey] = useState("");\n  const [body, setBody] = useState(requestExample == null ? "" : JSON.stringify(requestExample, null, 2));\n  const [result, setResult] = useState("");\n  const [status, setStatus] = useState<number | null>(null);\n  const [loading, setLoading] = useState(false);\n  async function send() {\n    setLoading(true); setResult(""); setStatus(null);\n    try {\n      let target = path;\n      for (const parameter of parameters.filter((item) => item.in === "path")) target = target.replace("{" + parameter.name + "}", encodeURIComponent(values[parameter.name] ?? ""));\n      const url = new URL(target, window.location.origin);\n      for (const parameter of parameters.filter((item) => item.in === "query")) if (values[parameter.name]) url.searchParams.set(parameter.name, values[parameter.name]);\n      const headers = new Headers();\n      if (apiKey) headers.set(apiKeyHeader, apiKey);\n      if (body && !["GET", "HEAD"].includes(method)) headers.set("Content-Type", "application/json");\n      const response = await fetch(url, { method, headers, body: body && !["GET", "HEAD"].includes(method) ? body : undefined });\n      setStatus(response.status);\n      const text = await response.text();\n      try { setResult(JSON.stringify(JSON.parse(text), null, 2)); } catch { setResult(text); }\n    } catch (error) { setResult(error instanceof Error ? error.message : String(error)); } finally { setLoading(false); }\n  }\n  return <div className="not-prose my-8 rounded-xl border bg-fd-card p-5"><div className="mb-4"><h2 className="text-lg font-semibold">Try this endpoint</h2><p className="text-sm text-fd-muted-foreground">Requests are sent from this page to the local Caravel gateway.</p></div><div className="grid gap-4">\n    <label className="grid gap-1 text-sm"><span>{apiKeyHeader}</span><input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Enter a local API key" className="rounded-md border bg-fd-background px-3 py-2" /></label>\n    {parameters.map((parameter) => <label key={parameter.in + parameter.name} className="grid gap-1 text-sm"><span>{parameter.name} <span className="text-fd-muted-foreground">({parameter.in}{parameter.required ? ", required" : ""})</span></span><input value={values[parameter.name] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [parameter.name]: event.target.value }))} className="rounded-md border bg-fd-background px-3 py-2" /></label>)}\n    {!["GET", "HEAD"].includes(method) ? <label className="grid gap-1 text-sm"><span>JSON body</span><textarea value={body} onChange={(event) => setBody(event.target.value)} rows={10} className="rounded-md border bg-fd-background px-3 py-2 font-mono text-xs" /></label> : null}\n    <button type="button" onClick={send} disabled={loading} className="w-fit rounded-md bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground disabled:opacity-50">{loading ? "Sending..." : "Send request"}</button>\n    {status !== null ? <div><p className="mb-2 text-sm font-medium">Response: {status}</p><pre className="max-h-96 overflow-auto rounded-md bg-fd-secondary p-4 text-xs"><code>{result}</code></pre></div> : null}\n  </div></div>;\n}\n`;
}

function snippetsPage() {
  return `import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";\nimport { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";\nimport { apiDocumentation } from "../api-docs";\n\nexport default async function Page() {\n  const snippets = apiDocumentation.operations.flatMap((operation) => operation.snippets.map((snippet) => ({ ...snippet, operation })));\n  return <DocsPage><DocsTitle>Embeds</DocsTitle><DocsDescription>Generate editable interface components grounded in this API.</DocsDescription><DocsBody><p>Describe the interface you need, let Caravel draft it from the selected endpoint, then review and copy the result into your application.</p>{await Promise.all(snippets.map(async ({ operation, ...snippet }) => <section id={operation.slug} key={snippet.id}><h2>{snippet.name}</h2><p>{snippet.description}</p><p><strong>Uses:</strong> <code>{operation.method} {operation.gatewayPath}</code></p><h3>Generation prompt</h3>{await ServerCodeBlock({ lang: "text", code: snippet.prompt })}{snippet.code ? <><h3>Embed code</h3>{await ServerCodeBlock({ lang: "tsx", code: snippet.code })}</> : <p>Ask Caravel to generate this embed, then review and save the code before using it.</p>}</section>))}</DocsBody></DocsPage>;\n}\n`;
}

function operationPage() {
  return `import { notFound } from "next/navigation";\nimport { DocsPage } from "fumadocs-ui/page";\nimport { apiDocumentation, openApiDocument } from "../../api-docs";\nimport { OpenAPIReference } from "../../openapi-reference";\n\nexport function generateStaticParams() {\n  return apiDocumentation.operations.map((operation) => ({ operation: operation.slug }));\n}\n\nexport default async function Page({ params }: { params: Promise<{ operation: string }> }) {\n  const { operation: operationSlug } = await params;\n  const operation = apiDocumentation.operations.find((candidate) => candidate.slug === operationSlug);\n  if (!operation) notFound();\n  return <DocsPage full><OpenAPIReference document={openApiDocument} operation={{ path: operation.gatewayPath, method: operation.method.toLowerCase() }} /></DocsPage>;\n}\n`;
}

function openApiReferenceComponent() {
  return `"use client";\n\nimport { createOpenAPIPage } from "fumadocs-openapi/ui";\n\nconst OpenAPIPage = createOpenAPIPage({\n  playground: { enabled: true },\n  showResponseSchema: true,\n  schemaUI: { showExample: true },\n  content: {\n    renderOperationLayout: (slots) => (\n      <div className="caravel-reference-shell">\n        <header className="caravel-reference-header">{slots.header}{slots.description}</header>\n        <div className="caravel-reference-grid">\n          <div className="caravel-reference-content">\n            {slots.apiPlayground}\n            {slots.authSchemes}\n            {slots.parameters}\n            {slots.body}\n            {slots.responses}\n            {slots.callbacks}\n          </div>\n          <aside className="caravel-reference-examples"><div className="caravel-reference-examples-inner"><p className="caravel-reference-examples-title">Examples</p>{slots.apiExample}</div></aside>\n        </div>\n      </div>\n    ),\n  },\n});\n\nexport function OpenAPIReference({ document, operation }: { document: object; operation: { path: string; method: string } }) {\n  return <OpenAPIPage document="caravel" payload={{ bundled: document as never }} operations={[operation as never]} showTitle showDescription />;\n}\n`;
}

function docsLoadingPage() {
  return `import { DocsPage } from "fumadocs-ui/page";\n\nexport default function Loading() {\n  return <DocsPage full><div className="mx-auto w-full max-w-5xl px-6 py-10" aria-label="Loading documentation"><div className="mb-8 h-5 w-40 animate-pulse rounded bg-fd-secondary"/><div className="mb-4 h-10 w-2/3 animate-pulse rounded bg-fd-secondary"/><div className="mb-10 h-5 w-1/2 animate-pulse rounded bg-fd-secondary"/><div className="grid gap-4"><div className="h-20 animate-pulse rounded-xl border bg-fd-card"/><div className="h-52 animate-pulse rounded-xl border bg-fd-card"/><div className="h-40 animate-pulse rounded-xl border bg-fd-card"/></div></div></DocsPage>;\n}\n`;
}

function docsLayoutStyles() {
  return `#nd-docs-layout > [class*="items-end"][class*="overflow-auto"][class*="border-b"] {\n  align-items: center;\n  align-self: start;\n  height: 52px;\n  min-height: 52px;\n  padding-top: 0;\n  position: sticky;\n  top: 0;\n}\n\n@media (min-width: 768px) {\n  #nd-sidebar [data-search-full] {\n    background: var(--color-fd-background);\n    position: fixed;\n    right: 24px;\n    top: 8px;\n    width: 220px;\n    z-index: 40;\n  }\n}\n\n#nd-docs-layout > article {\n  padding-top: 76px;\n}\n\n.caravel-reference-shell {\n  width: 100%;\n}\n\n.caravel-reference-header {\n  border-bottom: 1px solid var(--color-fd-border);\n  margin-bottom: 2rem;\n  padding-bottom: 1.5rem;\n}\n\n.caravel-reference-header > :first-child {\n  margin-top: 0;\n}\n\n.caravel-reference-grid {\n  display: grid;\n  gap: 2.5rem;\n  grid-template-columns: minmax(0, 1.15fr) minmax(360px, 0.85fr);\n  width: 100%;\n}\n\n.caravel-reference-content {\n  min-width: 0;\n}\n\n.caravel-reference-content > * + * {\n  margin-top: 2rem;\n}\n\n.caravel-reference-content [id^="parameters."] > div:first-child {\n  align-items: center;\n  min-height: 28px;\n}\n\n.caravel-reference-content [id^="parameters."] > div:first-child > span {\n  align-items: center;\n  display: inline-flex;\n  line-height: 1.25rem;\n}\n\n.caravel-reference-content [id^="parameters."] > div:first-child > button {\n  align-self: center;\n  margin-block: 0;\n}\n\n.caravel-reference-content .not-prose.flex.flex-wrap.items-center {\n  min-height: 28px;\n}\n\n.caravel-reference-content .not-prose.flex.flex-wrap.items-center > span {\n  align-items: center;\n  display: inline-flex;\n  line-height: 1.25rem;\n}\n\n.caravel-reference-examples {\n  align-self: stretch;\n  border-left: 1px solid var(--color-fd-border);\n  min-height: calc(100vh - 190px);\n  min-width: 0;\n  padding-left: 2rem;\n}\n\n.caravel-reference-examples-inner {\n  position: sticky;\n  top: 76px;\n}\n\n.caravel-reference-examples-title {\n  color: var(--color-fd-muted-foreground);\n  font-size: 0.75rem;\n  font-weight: 600;\n  letter-spacing: 0.08em;\n  margin: 0 0 0.75rem;\n  text-transform: uppercase;\n}\n\n.caravel-reference-examples-inner > * + * {\n  margin-top: 1rem;\n}\n\n@media (max-width: 1100px) {\n  .caravel-reference-grid {\n    grid-template-columns: minmax(0, 1fr);\n  }\n\n  .caravel-reference-examples {\n    border-left: 0;\n    border-top: 1px solid var(--color-fd-border);\n    min-height: 0;\n    padding-left: 0;\n    padding-top: 2rem;\n  }\n\n  .caravel-reference-examples-inner {\n    position: static;\n  }\n}\n\n@media (max-width: 767px) {\n  #nd-docs-layout > article {\n    padding-top: 1.5rem;\n  }\n}\n`;
}

function openApiPage(documentation) {
  return `import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";\n\nexport default function Page() {\n  return <DocsPage><DocsTitle>OpenAPI specification</DocsTitle><DocsDescription>The machine-readable source used to generate this portal, SDK configuration, and gateway.</DocsDescription><DocsBody><h2>Interactive API reference</h2><p>Open any endpoint under <strong>API Reference</strong> to enter authentication, edit parameters, generate request examples, and send a test request without leaving Fumadocs.</p><h2>Generated specification</h2><p><a href="/caravel-openapi.json">Open or download the generated OpenAPI JSON</a>.</p><h2>Original source</h2><p><a href=${JSON.stringify(documentation.source)}>${documentation.source}</a></p><h2>Use the specification</h2><p>Import it into another API client, generate an SDK, or give it to an agent that supports OpenAPI tools.</p></DocsBody></DocsPage>;\n}\n`;
}

function docsChromeStyles() {
  return `@media (min-width: 768px) {\n  #nd-sidebar {\n    padding-top: 52px;\n  }\n\n  #nd-sidebar > div:first-child {\n    align-items: center;\n    background: var(--color-fd-background);\n    border-bottom: 1px solid var(--color-fd-border);\n    display: flex;\n    height: 52px;\n    left: max(0px, calc((100vw - 1552px) / 2));\n    padding: 0 16px;\n    position: fixed;\n    top: 0;\n    width: 268px;\n    z-index: 41;\n  }\n\n  #nd-sidebar > div:first-child > div:first-child {\n    align-items: center;\n    height: 100%;\n    width: 100%;\n  }\n\n  #nd-sidebar > div:first-child > div:first-child > a {\n    max-width: 206px;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n  }\n\n  #nd-sidebar [data-search-full] {\n    background: var(--color-fd-secondary);\n    right: max(24px, calc((100vw - 1552px) / 2 + 24px));\n    z-index: 42;\n  }\n\n  #nd-sidebar > div:last-child {\n    align-items: center;\n    flex-direction: row;\n    height: 44px;\n    justify-content: flex-end;\n    padding: 8px 12px;\n    position: static;\n    width: 268px;\n  }\n\n  #nd-sidebar > div:last-child > div {\n    background: transparent;\n    border: 0;\n    width: auto;\n  }\n\n  #nd-sidebar [data-theme-toggle] {\n    border: 1px solid var(--color-fd-border);\n    border-radius: 8px;\n    margin: 0;\n  }\n}\n`;
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
  const editorialWorkspace = await ensureEditorialWorkspace(root, catalog);
  const documentation = buildDocumentationModel(openapi, catalog, manifest, editorialWorkspace.editorial, editorialWorkspace.snippets);
  const publishedOpenApi = publicOpenApi(openapi, manifest);
  await Promise.all([
    mkdir(resolve(output, "fern", "definition"), { recursive: true }),
    mkdir(resolve(output, "docs"), { recursive: true }),
    mkdir(resolve(output, "docs-app", "endpoints"), { recursive: true }),
    mkdir(resolve(output, "docs-app", "quickstart"), { recursive: true }),
    mkdir(resolve(output, "docs-app", "authentication"), { recursive: true }),
    mkdir(resolve(output, "docs-app", "sdks"), { recursive: true }),
    mkdir(resolve(output, "docs-app", "guides", "[operation]"), { recursive: true }),
    mkdir(resolve(output, "docs-app", "reference", "[operation]"), { recursive: true }),
    mkdir(resolve(output, "docs-app", "snippets"), { recursive: true }),
    mkdir(resolve(output, "docs-app", "openapi"), { recursive: true }),
    mkdir(resolve(output, "access"), { recursive: true }),
    mkdir(resolve(output, ".well-known"), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(resolve(output, "fern", "definition", "openapi.json"), `${JSON.stringify(publishedOpenApi, null, 2)}\n`),
    writeFile(resolve(output, "fern", "generators.yml"), fernGeneratorsConfig()),
    writeFile(resolve(output, "fern", "fern.config.json"), fernCliConfig()),
    writeFile(resolve(output, "docs", "index.mdx"), overviewDoc(catalog, manifest)),
    writeFile(resolve(output, "docs", "endpoints.mdx"), endpointsDoc(catalog)),
    writeFile(resolve(output, "docs", "meta.json"), `${JSON.stringify({ title: catalog.source.title, pages: ["index", "endpoints"] }, null, 2)}\n`),
    writeFile(resolve(output, "docs-app", "api-docs.ts"), docsData(documentation, publishedOpenApi)),
    writeFile(resolve(output, "docs-app", "openapi-reference.tsx"), openApiReferenceComponent()),
    writeFile(resolve(output, "docs-app", "loading.tsx"), docsLoadingPage()),
    writeFile(resolve(output, "docs-app", "caravel-docs.css"), `${docsLayoutStyles()}\n${docsChromeStyles()}`),
    writeFile(resolve(output, "docs-app", "layout.tsx"), docsLayout(documentation)),
    writeFile(resolve(output, "docs-app", "page.tsx"), overviewPage(catalog, manifest, documentation)),
    writeFile(resolve(output, "docs-app", "endpoints", "page.tsx"), endpointsPage(catalog)),
    writeFile(resolve(output, "docs-app", "quickstart", "page.tsx"), quickstartPage(documentation, manifest)),
    writeFile(resolve(output, "docs-app", "authentication", "page.tsx"), authenticationPage(manifest)),
    writeFile(resolve(output, "docs-app", "sdks", "page.tsx"), sdksPage()),
    writeFile(resolve(output, "docs-app", "guides", "[operation]", "page.tsx"), guidePage()),
    writeFile(resolve(output, "docs-app", "reference", "page.tsx"), referenceOverviewPage(documentation)),
    writeFile(resolve(output, "docs-app", "reference", "[operation]", "page.tsx"), operationPage()),
    writeFile(resolve(output, "docs-app", "snippets", "page.tsx"), snippetsPage()),
    writeFile(resolve(output, "docs-app", "openapi", "page.tsx"), openApiPage(documentation)),
    writeFile(resolve(output, "docs-app", "openapi.json"), `${JSON.stringify(publishedOpenApi, null, 2)}\n`),
    writeFile(resolve(output, "access", "next.ts"), accessWrapper(manifest)),
    writeFile(resolve(output, "access", "gateway-route.ts"), gatewayRoute(manifest)),
    writeFile(resolve(output, ".well-known", "caravel.json"), `${JSON.stringify(manifest, null, 2)}\n`),
    writeFile(resolve(output, ".well-known", "agent-card.json"), `${JSON.stringify(agentCard, null, 2)}\n`),
  ]);
  return { output, manifest, files: ["fern/definition/openapi.json", "fern/generators.yml", "fern/fern.config.json", "docs/index.mdx", "docs/endpoints.mdx", "docs-app/api-docs.ts", "docs-app/openapi-reference.tsx", "docs-app/loading.tsx", "docs-app/caravel-docs.css", "docs-app/layout.tsx", "docs-app/page.tsx", "docs-app/quickstart/page.tsx", "docs-app/authentication/page.tsx", "docs-app/sdks/page.tsx", "docs-app/guides/[operation]/page.tsx", "docs-app/reference/page.tsx", "docs-app/reference/[operation]/page.tsx", "docs-app/snippets/page.tsx", "docs-app/openapi/page.tsx", "docs-app/openapi.json", "access/next.ts", "access/gateway-route.ts", ".well-known/caravel.json", ".well-known/agent-card.json"] };
}

export function formatBuildResult(result) {
  return ["Caravel product build", "", ...result.files.map((file) => `✓ ${file}`), "", `Output: ${result.output}`].join("\n");
}
