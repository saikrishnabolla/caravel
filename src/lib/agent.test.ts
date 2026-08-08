import { afterEach, describe, expect, it } from "vitest";
import { planPurchase } from "./agent";
import { simulateMonadX402Purchase } from "./monad";

const originalOpenAIKey = process.env.OPENAI_API_KEY;

afterEach(() => {
  if (originalOpenAIKey) process.env.OPENAI_API_KEY = originalOpenAIKey;
  else delete process.env.OPENAI_API_KEY;
});

describe("agent commerce fallback", () => {
  it("creates a safe purchase plan without an AI API key", async () => {
    delete process.env.OPENAI_API_KEY;
    const plan = await planPurchase({
      objective: "Purchase verified GTM contacts for a Canadian campaign.",
      budgetCents: 5000,
      maxUnitCostCents: 40,
      minimumRecords: 100,
      minimumQualityRate: 0.9,
    });

    expect(plan.source).toBe("deterministic-fallback");
    expect(plan.selectedProviderId).toBe("deepline");
    expect(plan.primaryPaymentRail).toBe("rain_card");
  });

  it("creates an explicitly simulated Monad x402 receipt", () => {
    const receipt = simulateMonadX402Purchase();

    expect(receipt.mode).toBe("simulation");
    expect(receipt.network).toBe("Monad Testnet");
    expect(receipt.receiptId).toMatch(/^x402-sim-/);
  });
});
