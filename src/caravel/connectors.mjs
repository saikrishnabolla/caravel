import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete"]);

function priceFromOperation(operation) {
  const value = operation?.["x-caravel-price"] ?? operation?.["x-raingentic-price"];
  if (!value) return null;
  const amount = Number(typeof value === "object" ? value.amount : value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return {
    amount,
    currency: typeof value === "object" ? value.currency ?? "USD" : "USD",
    unit: typeof value === "object" ? value.unit ?? "request" : "request",
    provenance: "source",
  };
}

export function normalizeOpenApi(document, location) {
  const products = Object.entries(document.paths ?? {}).flatMap(([path, methods]) =>
    Object.entries(methods ?? {})
      .filter(([method]) => HTTP_METHODS.has(method.toLowerCase()))
      .map(([method, operation]) => ({
        id: operation.operationId ?? `${method}-${path}`.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase(),
        name: operation.summary ?? operation.operationId ?? `${method.toUpperCase()} ${path}`,
        kind: "api-operation",
        description: operation.description ?? "",
        method: method.toUpperCase(),
        path,
        offer: priceFromOperation(operation),
        source: {
          connector: "openapi",
          location,
          pointer: `#/paths/${path.replaceAll("~", "~0").replaceAll("/", "~1")}/${method}`,
        },
      })),
  );
  if (products.length === 0) throw new Error("The OpenAPI document contains no callable operations.");
  return {
    schema: "caravel/catalog/v1",
    source: {
      type: "openapi",
      location,
      title: document.info?.title ?? "API catalog",
      connectedAt: new Date().toISOString(),
    },
    products,
  };
}

export function normalizeShopify(document, location, endpoint) {
  const products = (document.products ?? []).map((product) => ({
    id: String(product.id),
    name: product.title,
    kind: "physical-product",
    description: String(product.body_html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    handle: product.handle,
    vendor: product.vendor ?? "",
    category: product.product_type ?? "",
    image: product.images?.[0]?.src ?? null,
    variants: (product.variants ?? []).map((variant) => ({
      id: String(variant.id),
      name: variant.title,
      price: Number(variant.price),
      currency: "USD",
      available: Boolean(variant.available),
    })),
    source: {
      connector: "shopify-public",
      location,
      pointer: `/products/${product.handle}`,
    },
  }));
  if (products.length === 0) throw new Error("The Shopify-compatible catalog contains no public products.");
  return {
    schema: "caravel/catalog/v1",
    source: {
      type: "shopify-public",
      location,
      endpoint,
      title: new URL(location).hostname,
      connectedAt: new Date().toISOString(),
    },
    products,
  };
}

function shopifyEndpoint(input) {
  const url = new URL(input);
  const collection = url.pathname.match(/^\/collections\/([^/]+)/);
  url.pathname = collection ? `/collections/${collection[1]}/products.json` : "/products.json";
  url.search = "?limit=250";
  return url.toString();
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "Caravel/0.1" },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}.`);
  return response.json();
}

function detectJson(document) {
  if (document?.openapi || document?.swagger || document?.paths) return "openapi";
  if (Array.isArray(document?.products)) return "shopify-public";
  return null;
}

export async function connectSource(input, options = {}) {
  const type = options.type ?? "auto";
  const isUrl = /^https?:\/\//i.test(input);

  if (!isUrl) {
    const location = resolve(input);
    const document = JSON.parse(await readFile(location, "utf8"));
    const detected = type === "auto" ? detectJson(document) : type;
    if (detected === "openapi") return normalizeOpenApi(document, location);
    if (detected === "shopify" || detected === "shopify-public") return normalizeShopify(document, location, location);
    throw new Error(`Caravel could not identify ${basename(location)}. Use --type openapi or --type shopify.`);
  }

  if (type === "openapi") return normalizeOpenApi(await fetchJson(input), input);
  if (type === "shopify" || type === "shopify-public") {
    const endpoint = shopifyEndpoint(input);
    return normalizeShopify(await fetchJson(endpoint), input, endpoint);
  }

  try {
    const document = await fetchJson(input);
    const detected = detectJson(document);
    if (detected === "openapi") return normalizeOpenApi(document, input);
    if (detected === "shopify-public") return normalizeShopify(document, input, input);
  } catch {
    // A storefront page is normally HTML. Try its public Shopify catalog next.
  }

  const endpoint = shopifyEndpoint(input);
  try {
    return normalizeShopify(await fetchJson(endpoint), input, endpoint);
  } catch {
    throw new Error("Caravel could not find a structured catalog. Connect an OpenAPI document, a Shopify-compatible store, or specify a connector with --type.");
  }
}
