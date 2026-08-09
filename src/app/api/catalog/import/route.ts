type ImportBody = { source?: string; location?: string };

function resolveLocation(location: string, origin: string) {
  const url = new URL(location, origin);
  if (!/^https?:$/.test(url.protocol)) throw new Error("Only HTTP and HTTPS catalog sources are supported");
  if (url.origin !== origin) {
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host === "::1" || host.startsWith("127.") || host.startsWith("10.") || host.startsWith("192.168.") || /^172\.(1[6-9]|2\d|3[01])\./.test(host) || host.startsWith("169.254.")) throw new Error("Private network catalog locations are not supported");
  }
  return url;
}

function shopifyProductsUrl(input: URL) {
  const url = new URL(input);
  const collectionMatch = url.pathname.match(/^\/collections\/([^/]+)/);
  url.pathname = collectionMatch ? `/collections/${collectionMatch[1]}/products.json` : "/products.json";
  url.search = "?limit=250";
  return url;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as ImportBody;
    const source = body.source ?? "openapi";
    const location = body.location?.trim();
    if (!location) throw new Error("A catalog location is required");
    const origin = new URL(request.url).origin;
    const input = resolveLocation(location, origin);

    if (source === "openapi") {
      const response = await fetch(input, { cache: "no-store", signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error(`OpenAPI source returned ${response.status}`);
      const document = await response.json() as { info?: { title?: string }; paths?: Record<string, Record<string, { summary?: string; operationId?: string; description?: string; "x-raingentic-price"?: { amount?: string; currency?: string; unit?: string }; "x-raingentic-payment"?: unknown }>> };
      const operations = Object.entries(document.paths ?? {}).flatMap(([path, methods]) => Object.entries(methods).filter(([method]) => ["get","post","put","patch","delete"].includes(method.toLowerCase())).map(([method, operation]) => ({ method: method.toUpperCase(), path, name: operation.summary ?? operation.operationId ?? path, description: operation.description ?? "", price: operation["x-raingentic-price"] ?? null, payment: operation["x-raingentic-payment"] ?? null })));
      if (operations.length === 0) throw new Error("No API operations were found");
      return Response.json({ source: "openapi", title: document.info?.title ?? input.hostname, location: input.toString(), operations });
    }

    if (source === "commerce" || source === "website") {
      const endpoint = shopifyProductsUrl(input);
      const response = await fetch(endpoint, { cache: "no-store", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error(`Store catalog returned ${response.status}`);
      const document = await response.json() as { products?: Array<{ id: number; title: string; handle: string; vendor?: string; product_type?: string; variants?: Array<{ id: number; title: string; price: string; available: boolean }>; images?: Array<{ src: string }> }> };
      const products = (document.products ?? []).map(product => ({ id: String(product.id), name: product.title, handle: product.handle, vendor: product.vendor ?? "", type: product.product_type ?? "Product", image: product.images?.[0]?.src ?? null, variants: (product.variants ?? []).map(variant => ({ id: String(variant.id), name: variant.title, price: variant.price, available: variant.available })) }));
      if (products.length === 0) throw new Error("No public products were found at this store");
      return Response.json({ source: "shopify-public", store: input.origin, endpoint: endpoint.toString(), products });
    }

    return Response.json({ source, location: input.toString(), status: "connector-ready", capabilities: ["products", "prices", "variants", "availability", "checkout"] });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Catalog import failed" }, { status: 400 });
  }
}
