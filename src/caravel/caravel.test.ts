import { describe, expect, it } from "vitest";
import { normalizeOpenApi, normalizeShopify } from "./connectors.mjs";
import { createReadinessReport } from "./report.mjs";
import { piArguments } from "./pi.mjs";

describe("Caravel catalog connection", () => {
  it("normalizes OpenAPI operations with provenance", () => {
    const catalog = normalizeOpenApi({
      info: { title: "Example API" },
      paths: { "/weather": { get: { operationId: "getWeather", summary: "Weather", "x-caravel-price": { amount: 0.02, currency: "USD" } } } },
    }, "https://example.com/openapi.json");
    expect(catalog.products).toHaveLength(1);
    expect(catalog.products[0]).toMatchObject({ id: "getWeather", method: "GET", offer: { amount: 0.02 }, source: { connector: "openapi" } });
  });

  it("normalizes a Shopify-compatible catalog", () => {
    const catalog = normalizeShopify({ products: [{ id: 1, title: "Drone", handle: "drone", variants: [{ id: 2, title: "Default", price: "1200.00", available: true }] }] }, "https://shop.example.com", "https://shop.example.com/products.json");
    expect(catalog.products[0].variants[0]).toMatchObject({ price: 1200, available: true });
  });

  it("reports missing commercial configuration without fabricating it", () => {
    const catalog = normalizeOpenApi({ paths: { "/status": { get: { summary: "Status" } } } }, "https://example.com/openapi.json");
    const report = createReadinessReport(catalog);
    expect(report.status).toBe("needs-review");
    expect(report.summary.missingPrices).toBe(1);
    expect(report.warnings.some((warning) => warning.id === "policy")).toBe(true);
  });
});

describe("Caravel Pi runtime", () => {
  it("loads the Caravel prompt, extension, skill, and user arguments", () => {
    const args = piArguments(["--print", "Inspect this API"], "/tmp/caravel");
    expect(args).toEqual([
      "/tmp/caravel/node_modules/@earendil-works/pi-coding-agent/dist/cli.js",
      "--append-system-prompt",
      "/tmp/caravel/runtime/SYSTEM.md",
      "--extension",
      "/tmp/caravel/extensions/caravel.ts",
      "--skill",
      "/tmp/caravel/skills/caravel-agentic-commerce",
      "--print",
      "Inspect this API",
    ]);
  });
});
