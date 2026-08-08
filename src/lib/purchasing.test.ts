import { describe, expect, it } from "vitest";
import {
  selectQuote,
  successfulDelivery,
  vendorQuotes,
  verifyDelivery,
} from "./purchasing";

const mandate = {
  objective: "Purchase verified GTM contacts for a customer campaign.",
  budgetCents: 5000,
  maxUnitCostCents: 40,
  minimumRecords: 100,
  minimumQualityRate: 0.9,
};

describe("purchasing policy", () => {
  it("selects the lowest-priced quote satisfying every mandate rule", () => {
    const result = selectQuote(vendorQuotes, mandate);

    expect(result.selected?.id).toBe("deepline");
    expect(result.decisions.filter((quote) => quote.eligible)).toHaveLength(1);
  });

  it("explains why unsuitable providers were rejected", () => {
    const result = selectQuote(vendorQuotes, mandate);
    const clay = result.decisions.find((quote) => quote.id === "clay-workflow");
    const apollo = result.decisions.find((quote) => quote.id === "apollo-export");

    expect(clay?.reasons).toContain("Unit price exceeds the approved maximum");
    expect(apollo?.reasons).toContain(
      "Expected quality is below the required threshold",
    );
  });

  it("verifies delivery independently from payment authorization", () => {
    const result = verifyDelivery(successfulDelivery, mandate);

    expect(result.passed).toBe(true);
    expect(result.checks.every((check) => check.passed)).toBe(true);
  });
});
