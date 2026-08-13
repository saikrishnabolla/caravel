import { Agent, run } from "@openai/agents";
import { z } from "zod";

const setupPlanSchema = z.object({
  businessSummary: z.string(),
  catalogStrategy: z.string(),
  pricingStrategy: z.string(),
  paymentAssignments: z.array(z.object({ productCategory: z.string(), paymentRail: z.enum(["monad_x402", "rain_card", "existing_checkout"]), reason: z.string() })),
  approvalRule: z.string(),
  nextActions: z.array(z.string()).min(1).max(8),
});

export type SetupPlan = z.infer<typeof setupPlanSchema> & { source: "openai-agent" | "deterministic-fallback" };

export async function prepareCommerceSetup(request: string, catalog: unknown): Promise<SetupPlan> {
  const fallback: SetupPlan = {
    businessSummary: "The business sells metered API operations and high-value physical equipment.",
    catalogStrategy: "Publish API operations independently and preserve store variants as physical products.",
    pricingStrategy: "Use per-request USDC prices for APIs and source prices for physical products.",
    paymentAssignments: [{ productCategory: "API operations", paymentRail: "monad_x402", reason: "Machine-readable services can settle per request." },{ productCategory: "Physical products", paymentRail: "rain_card", reason: "Scoped cards enforce merchant, category, amount, and expiration controls." }],
    approvalRule: "Require human approval for new merchants and purchases above $1,000.",
    nextActions: ["Review imported products", "Confirm endpoint price floors", "Confirm high-value approval rules", "Publish the agent catalog"],
    source: "deterministic-fallback",
  };
  const key = process.env.OPENAI_API_KEY ?? process.env.openai_key;
  if (!key) return fallback;
  if (!process.env.OPENAI_API_KEY) process.env.OPENAI_API_KEY = key;
  const agent = new Agent({ name: "Caravel business onboarding agent", model: process.env.OPENAI_AGENT_MODEL ?? "gpt-5.6", instructions: ["Prepare a conservative agent-commerce setup plan from the user's request and imported catalog.","Use Monad x402 for small API and data calls.","Use Rain cards for controlled traditional merchant payments.","Keep existing checkout when it remains responsible for tax, inventory, or fulfillment.","Require human review before publishing or moving money."].join(" "), outputType: setupPlanSchema });
  try {
    const result = await Promise.race([
      run(agent, JSON.stringify({ request, catalog })),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 6000)),
    ]);
    if (!result) return fallback;
    return result.finalOutput ? { ...result.finalOutput, source: "openai-agent" } : fallback;
  } catch { return fallback; }
}
