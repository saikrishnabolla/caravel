#!/usr/bin/env node

const [baseUrl = "http://localhost:3021"] = process.argv.slice(2);
const specificationResponse = await fetch(new URL("/api/openapi", baseUrl));
if (!specificationResponse.ok) throw new Error(`OpenAPI request failed with ${specificationResponse.status}`);
const specification = await specificationResponse.json();
const results = [];

for (const [path, methods] of Object.entries(specification.paths ?? {})) {
  for (const method of Object.keys(methods)) {
    if (!["get", "post", "put", "patch", "delete"].includes(method)) continue;
    const url = new URL(path, baseUrl);
    if (path.startsWith("/api/preflight/")) {
      url.searchParams.set("latitude", "40.7128");
      url.searchParams.set("longitude", "-74.006");
      const response = await fetch(url, { method: method.toUpperCase(), headers: { "Content-Type": "application/json" }, body: method === "get" ? undefined : JSON.stringify({ latitude: 40.7128, longitude: -74.006 }) });
      if (!response.ok) throw new Error(`${method.toUpperCase()} ${path} failed with ${response.status}`);
      results.push({ method: method.toUpperCase(), path, status: response.status });
    } else if (path.startsWith("/api/x402/")) {
      const response = await fetch(url);
      if (![401, 402].includes(response.status)) throw new Error(`${path} should require AP2 or x402 payment, received ${response.status}`);
      results.push({ method: "GET", path, status: response.status, protected: true });
    }
  }
}

console.log(JSON.stringify({ title: specification.info?.title, operationsTested: results.length, results }, null, 2));
