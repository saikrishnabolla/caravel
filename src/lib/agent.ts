import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";
import {
  buildNegotiation,
  formatUsd,
  getVendorQuotes,
  selectQuote,
  type Mandate,
  type QuoteDecision,
} from "./purchasing";

const agentPlanSchema = z.object({
  selectedProviderId: z.string(),
  summary: z.string(),
  rejectedProviderIds: z.array(z.string()),
  customerPaymentRail: z.literal("monad_x402"),
  fulfillmentPaymentRail: z.literal("rain_card"),
});

export type PurchasingAgentPlan = z.infer<typeof agentPlanSchema> & {
  source: "openai-agent" | "deterministic-fallback";
};

function safeSummary(selected: QuoteDecision) {
  return `${selected.provider} negotiated a complete mission-readiness package at ${formatUsd(selected.amountCents)} total and ${formatUsd(selected.unitCostCents)} per mission. The customer agent pays through Monad x402; the fulfillment agent uses a scoped Rain card for traditional upstream providers.`;
}

function deterministicPlan(decisions: QuoteDecision[]): PurchasingAgentPlan {
  const selected = decisions.find(quote => quote.eligible);
  if (!selected) throw new Error("No provider satisfies the purchasing mandate");
  return {
    selectedProviderId: selected.id,
    summary: safeSummary(selected),
    rejectedProviderIds: decisions.filter(quote => !quote.eligible).map(quote => quote.id),
    customerPaymentRail: "monad_x402",
    fulfillmentPaymentRail: "rain_card",
    source: "deterministic-fallback",
  };
}

export async function planPurchase(mandate: Mandate): Promise<PurchasingAgentPlan> {
  const vendorQuotes = getVendorQuotes(mandate);
  const negotiation = buildNegotiation(mandate);
  const { decisions } = selectQuote(vendorQuotes, mandate);
  const fallback = deterministicPlan(decisions);
  const openAIKey = process.env.OPENAI_API_KEY ?? process.env.openai_key;
  if (!openAIKey) return fallback;
  if (!process.env.OPENAI_API_KEY) process.env.OPENAI_API_KEY = openAIKey;

  const listOffers = tool({
    name: "list_mission_readiness_offers",
    description: "List available agricultural drone mission-readiness offers.",
    parameters: z.object({}),
    async execute() { return JSON.stringify(vendorQuotes); },
  });
  const evaluatePolicy = tool({
    name: "evaluate_business_policy",
    description: "Apply authoritative deterministic business policy to every offer.",
    parameters: z.object({}),
    async execute() { return JSON.stringify(decisions); },
  });
  const inspectNegotiation = tool({
    name: "inspect_a2a_negotiation",
    description: "Inspect the structured buyer-seller negotiation and final offer.",
    parameters: z.object({}),
    async execute() { return JSON.stringify(negotiation); },
  });

  const purchasingAgent = new Agent({
    name: "Caravel mission commerce agent",
    model: process.env.OPENAI_AGENT_MODEL ?? "gpt-5.6",
    instructions: [
      "You are a purchasing agent for an agricultural drone operator.",
      "Call all tools before choosing a provider.",
      "Only select a provider marked eligible by evaluate_business_policy.",
      "Treat the structured negotiation and deterministic pricing rules as authoritative.",
      "Use Monad x402 for the customer-to-seller machine payment.",
      "Use a Rain scoped card for the seller's traditional upstream fulfillment purchase.",
    ].join(" "),
    tools: [listOffers, evaluatePolicy, inspectNegotiation],
    outputType: agentPlanSchema,
  });

  try {
    const result = await run(purchasingAgent, `Create a purchase plan for: ${JSON.stringify(mandate)}`);
    const output = result.finalOutput;
    const selected = decisions.find(quote => quote.id === output?.selectedProviderId && quote.eligible);
    if (!output || !selected) return fallback;
    return { ...output, summary: safeSummary(selected), source: "openai-agent" };
  } catch {
    return fallback;
  }
}
