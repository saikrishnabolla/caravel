import { describe, expect, it } from "vitest";
import {
  buildNegotiation,
  getVendorQuotes,
  selectQuote,
  successfulDelivery,
  verifyDelivery,
} from "./purchasing";
import { createMissionClearAgentCard } from "./a2a";

const mandate = {
  objective: "Purchase agricultural mission-readiness packets for a seasonal operation.",
  budgetCents: 150_000,
  maxUnitCostCents: 1_500,
  minimumMissions: 100,
  minimumReadinessRate: 0.9,
};

describe("mission commerce policy", () => {
  it("publishes an official A2A v1.0 JSON-RPC interface", () => {
    const card = createMissionClearAgentCard("https://example.com");
    expect(card.supportedInterfaces[0]).toMatchObject({
      url: "https://example.com/api/a2a",
      protocolBinding: "JSONRPC",
      protocolVersion: "1.0",
    });
  });

  it("negotiates a volume package inside the buyer mandate", () => {
    const negotiation = buildNegotiation(mandate);
    expect(negotiation.finalAmountCents).toBe(145_000);
    expect(negotiation.turns).toHaveLength(5);
  });

  it("selects the negotiated provider satisfying every rule", () => {
    const result = selectQuote(getVendorQuotes(mandate), mandate);
    expect(result.selected?.id).toBe("missionclear-agent");
    expect(result.decisions.filter(quote => quote.eligible)).toHaveLength(1);
  });

  it("rejects expensive and incomplete alternatives", () => {
    const result = selectQuote(getVendorQuotes(mandate), mandate);
    const enterprise = result.decisions.find(quote => quote.id === "enterprise-ops-suite");
    const manual = result.decisions.find(quote => quote.id === "manual-compliance-desk");
    expect(enterprise?.reasons).toContain("Total price exceeds the approved budget");
    expect(manual?.reasons).toContain("Expected readiness coverage is below the required threshold");
  });

  it("verifies the delivered mission packet independently from payment", () => {
    const result = verifyDelivery(successfulDelivery, mandate);
    expect(result.passed).toBe(true);
    expect(result.checks.every(check => check.passed)).toBe(true);
  });
});
