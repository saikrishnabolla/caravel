import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";
import {
  type Mandate,
  type QuoteDecision,
  selectQuote,
  vendorQuotes,
} from "./purchasing";

const agentPlanSchema = z.object({
  selectedProviderId: z.string(),
  summary: z.string(),
  rejectedProviderIds: z.array(z.string()),
  primaryPaymentRail: z.literal("rain_card"),
  verificationPaymentRail: z.literal("monad_x402"),
});

export type PurchasingAgentPlan = z.infer<typeof agentPlanSchema> & {
  source: "openai-agent" | "deterministic-fallback";
};

function deterministicPlan(decisions: QuoteDecision[]): PurchasingAgentPlan {
  const selected = decisions.find((quote) => quote.eligible);
  if (!selected) throw new Error("No provider satisfies the purchasing mandate");

  return {
    selectedProviderId: selected.id,
    summary: `${selected.provider} is the only offer that satisfies budget, unit-price, quantity, and quality requirements. Use a scoped Rain card for the vendor purchase and a simulated Monad x402 payment for delivery verification.`,
    rejectedProviderIds: decisions
      .filter((quote) => !quote.eligible)
      .map((quote) => quote.id),
    primaryPaymentRail: "rain_card",
    verificationPaymentRail: "monad_x402",
    source: "deterministic-fallback",
  };
}

export async function planPurchase(mandate: Mandate): Promise<PurchasingAgentPlan> {
  const { decisions } = selectQuote(vendorQuotes, mandate);
  const fallback = deterministicPlan(decisions);

  if (!process.env.OPENAI_API_KEY) return fallback;

  const listOffers = tool({
    name: "list_vendor_offers",
    description: "List the available vendor offers for the purchasing request.",
    parameters: z.object({}),
    async execute() {
      return JSON.stringify(vendorQuotes);
    },
  });

  const evaluatePolicy = tool({
    name: "evaluate_business_policy",
    description:
      "Apply deterministic business policy to every vendor offer. This result is authoritative.",
    parameters: z.object({}),
    async execute() {
      return JSON.stringify(decisions);
    },
  });

  const purchasingAgent = new Agent({
    name: "Raingentic purchasing agent",
    model: process.env.OPENAI_AGENT_MODEL ?? "gpt-5.6",
    instructions: [
      "You are a purchasing agent for a business.",
      "Call both tools before choosing a provider.",
      "Only select a provider marked eligible by evaluate_business_policy.",
      "Use a Rain card for the primary traditional vendor payment.",
      "Use Monad x402 for the small delivery-verification purchase.",
      "Explain the decision in plain business language.",
    ].join(" "),
    tools: [listOffers, evaluatePolicy],
    outputType: agentPlanSchema,
  });

  try {
    const result = await run(
      purchasingAgent,
      `Create a purchase plan for this mandate: ${JSON.stringify(mandate)}`,
    );
    const output = result.finalOutput;
    const selectedDecision = decisions.find(
      (quote) => quote.id === output?.selectedProviderId && quote.eligible,
    );
    if (!output || !selectedDecision) return fallback;

    return { ...output, source: "openai-agent" };
  } catch {
    return fallback;
  }
}
