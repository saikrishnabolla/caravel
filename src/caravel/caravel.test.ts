import { describe, expect, it } from "vitest";
import { normalizeOpenApi, normalizeShopify } from "./connectors.mjs";
import { createReadinessReport } from "./report.mjs";

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
