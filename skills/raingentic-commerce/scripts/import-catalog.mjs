#!/usr/bin/env node

const [baseUrl = "http://localhost:3021", source = "openapi", location = "/api/openapi"] = process.argv.slice(2);
const response = await fetch(new URL("/api/catalog/import", baseUrl), {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ source, location }),
});
const body = await response.json();
if (!response.ok) {
  console.error(body.error ?? `Catalog import failed with ${response.status}`);
  process.exit(1);
}
console.log(JSON.stringify(body, null, 2));
