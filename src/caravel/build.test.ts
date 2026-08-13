import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildApiProduct, createProductManifest } from "./build.mjs";
import { normalizeOpenApi } from "./connectors.mjs";
import { createReadinessReport } from "./report.mjs";
import { writeWorkspace } from "./workspace.mjs";

const document = {
  openapi: "3.1.0",
  info: { title: "Weather API", version: "1.0.0" },
  paths: { "/weather": { get: { operationId: "getWeather", summary: "Get weather", description: "Returns current weather." } } },
};

describe("Caravel product build", () => {
  it("keeps API-key access and adds x402 when configured", () => {
    const catalog = normalizeOpenApi(document, "/tmp/openapi.json");
    const manifest = createProductManifest(catalog, { x402Price: "0.01", x402PayTo: "0x1234" });
    expect(manifest.access.map((method) => method.type)).toEqual(["api-key", "x402"]);
    expect(manifest.access[1]).toMatchObject({ pricing: { type: "fixed", price: "$0.01" } });
    expect(manifest.products[0]).toMatchObject({ id: "getWeather", access: ["api-key", "x402"] });
  });

  it("generates discovery, Fern, Fumadocs, and access files", async () => {
    const root = await mkdtemp(join(tmpdir(), "caravel-build-"));
    const source = resolve(root, "openapi.json");
    await writeFile(source, JSON.stringify(document));
    const catalog = normalizeOpenApi(document, source);
    await writeWorkspace(root, catalog, createReadinessReport(catalog));
    const result = await buildApiProduct(root, { apiKeyHeader: "Authorization" });
    const discovery = JSON.parse(await readFile(resolve(result.output, ".well-known/caravel.json"), "utf8"));
    expect(discovery.products).toHaveLength(1);
    expect(discovery.products[0].endpoint).toBe("/api/caravel/weather");
    expect(await readFile(resolve(result.output, "fern/generators.yml"), "utf8")).toContain("fern-typescript-sdk");
    expect(await readFile(resolve(result.output, "fern/fern.config.json"), "utf8")).toContain('"version": "5.95.0"');
    expect(await readFile(resolve(result.output, "docs/endpoints.mdx"), "utf8")).toContain("GET /weather");
    expect(await readFile(resolve(result.output, "access/next.ts"), "utf8")).toContain("CARAVEL_API_KEYS");
    expect(await readFile(resolve(result.output, "access/gateway-route.ts"), "utf8")).toContain("upstreamBaseUrl");
  });
});
