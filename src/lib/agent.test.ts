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
      objective: "Purchase verified GTM contacts for a Canadian campaign.",
      budgetCents: 5000,
      maxUnitCostCents: 40,
      minimumRecords: 100,
      minimumQualityRate: 0.9,
    });

    expect(plan.source).toBe("deterministic-fallback");
    expect(plan.selectedProviderId).toBe("deepline");
    expect(plan.primaryPaymentRail).toBe("rain_card");
    expect(plan.summary).toContain("$32.00 total");
    expect(plan.summary).toContain("$0.32 per record");
  });

  it("rejects missing Monad buyer credentials without spending funds", () => {
    expect(() => getMonadBuyerPrivateKey({})).toThrow("MONAD_BUYER_PRIVATE_KEY");
    expect(() => getMonadProviderAddress({})).toThrow("MONAD_PROVIDER_ADDRESS");
  });
});
