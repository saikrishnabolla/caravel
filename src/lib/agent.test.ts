import { afterEach, describe, expect, it } from "vitest";
import { planPurchase } from "./agent";
import { getMonadBuyerPrivateKey, getMonadProviderAddress } from "./monad";

const originalOpenAIKey = process.env.OPENAI_API_KEY;
const originalLowercaseOpenAIKey = process.env.openai_key;

afterEach(() => {
  if (originalOpenAIKey) process.env.OPENAI_API_KEY = originalOpenAIKey;
  else delete process.env.OPENAI_API_KEY;
  if (originalLowercaseOpenAIKey) process.env.openai_key = originalLowercaseOpenAIKey;
  else delete process.env.openai_key;
});

describe("agent commerce fallback", () => {
  it("creates a safe purchase plan without an AI API key", async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.openai_key;
    const plan = await planPurchase({
      objective: "Purchase agricultural mission-readiness packets for a seasonal operation.",
      budgetCents: 150_000,
      maxUnitCostCents: 1_500,
      minimumMissions: 100,
      minimumReadinessRate: 0.9,
    });

    expect(plan.source).toBe("deterministic-fallback");
    expect(plan.selectedProviderId).toBe("missionclear-agent");
    expect(plan.customerPaymentRail).toBe("monad_x402");
    expect(plan.fulfillmentPaymentRail).toBe("rain_card");
    expect(plan.summary).toContain("$1,450.00 total");
    expect(plan.summary).toContain("$14.50 per mission");
  });

  it("rejects missing Monad buyer credentials without spending funds", () => {
    expect(() => getMonadBuyerPrivateKey({})).toThrow("MONAD_BUYER_PRIVATE_KEY");
    expect(() => getMonadProviderAddress({})).toThrow("MONAD_PROVIDER_ADDRESS");
  });
});
