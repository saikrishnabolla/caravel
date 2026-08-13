function productPriceState(product) {
  if (product.kind === "api-operation") return product.offer ? "priced" : "missing";
  const prices = (product.variants ?? []).map((variant) => variant.price).filter(Number.isFinite);
  return prices.length > 0 ? "priced" : "missing";
}

export function createReadinessReport(catalog) {
  const products = catalog.products ?? [];
  const missingDescriptions = products.filter((product) => !product.description?.trim()).length;
  const missingPrices = products.filter((product) => productPriceState(product) === "missing").length;
  const unavailable = products.filter((product) => product.variants?.length && !product.variants.some((variant) => variant.available)).length;
  const checks = [
    { id: "source", status: "pass", message: `${catalog.source.type} source connected` },
    { id: "products", status: products.length ? "pass" : "fail", message: `${products.length} products imported` },
    { id: "provenance", status: products.every((product) => product.source?.location) ? "pass" : "fail", message: "Product provenance recorded" },
  ];
  const warnings = [];
  if (missingDescriptions) warnings.push({ id: "descriptions", count: missingDescriptions, message: `${missingDescriptions} products need descriptions` });
  if (missingPrices) warnings.push({ id: "prices", count: missingPrices, message: `${missingPrices} products need pricing` });
  if (unavailable) warnings.push({ id: "availability", count: unavailable, message: `${unavailable} products have no available variants` });
  warnings.push({ id: "policy", message: "Commercial and negotiation rules are not configured yet" });
  warnings.push({ id: "publication", message: "Agent discovery has not been published yet" });
  return {
    schema: "caravel/readiness-report/v1",
    source: catalog.source,
    summary: {
      products: products.length,
      priced: products.length - missingPrices,
      missingPrices,
      missingDescriptions,
      unavailable,
    },
    checks,
    warnings,
    blockers: products.length ? [] : [{ id: "catalog", message: "No products were imported" }],
    status: products.length ? "needs-review" : "blocked",
    generatedAt: new Date().toISOString(),
  };
}

export function formatReadinessReport(report) {
  const lines = ["Caravel readiness report", "", `Source: ${report.source.title}`, `Connector: ${report.source.type}`, ""];
  for (const check of report.checks) lines.push(`${check.status === "pass" ? "✓" : "✗"} ${check.message}`);
  if (report.warnings.length) {
    lines.push("", "Needs review");
    for (const warning of report.warnings) lines.push(`! ${warning.message}`);
  }
  if (report.blockers.length) {
    lines.push("", "Blocked");
    for (const blocker of report.blockers) lines.push(`✗ ${blocker.message}`);
  }
  lines.push("", `Status: ${report.status}`);
  return lines.join("\n");
}
