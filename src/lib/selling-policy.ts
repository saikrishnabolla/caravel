import { Agent, run } from "@openai/agents";
import { z } from "zod";

export const sellingPolicySchema = z.object({
  product: z.string(),
  resource: z.string(),
  basePrice: z.number().nonnegative(),
  minimumPrice: z.number().nonnegative(),
  currency: z.enum(["USD", "USDC"]),
  maximumDiscountPercent: z.number().min(0).max(100),
  volumeThreshold: z.number().int().nonnegative(),
  newCustomersPrepay: z.boolean(),
  humanApprovalAbove: z.number().nonnegative(),
  settlement: z.string(),
});

export type SellingPolicy = z.infer<typeof sellingPolicySchema> & { source: "openai-agent" | "deterministic-fallback" };
export type SellingPolicyInput = { instructions: string; product: string; resource: string; basePrice: number; minimumPrice: number; maximumDiscountPercent: number; settlement: string; currency: "USD" | "USDC" };

function amountAfter(text: string, phrase: RegExp, fallback: number) {
  const match = text.match(phrase);
  return match?.[1] ? Number(match[1].replaceAll(",", "")) : fallback;
}

function fallbackPolicy(input: SellingPolicyInput): SellingPolicy {
  return {
    product: input.product,
    resource: input.resource,
    basePrice: input.basePrice,
    minimumPrice: input.minimumPrice,
    currency: input.currency,
    maximumDiscountPercent: input.maximumDiscountPercent,
    volumeThreshold: amountAfter(input.instructions, /(?:more than|over|above)\s+([\d,]+)\s+(?:requests|calls|units)/i, 0),
    newCustomersPrepay: /new customers?.*(?:prepay|pay first)|(?:prepay|pay first).*new customers?/i.test(input.instructions),
    humanApprovalAbove: amountAfter(input.instructions, /(?:approval|review).*?(?:above|over)\s+\$?([\d,]+)/i, 1000),
    settlement: input.settlement,
    source: "deterministic-fallback",
  };
}

export async function compileSellingPolicy(input: SellingPolicyInput): Promise<SellingPolicy> {
  const fallback = fallbackPolicy(input);
  const key = process.env.OPENAI_API_KEY ?? process.env.openai_key;
  if (!key) return fallback;
  if (!process.env.OPENAI_API_KEY) process.env.OPENAI_API_KEY = key;
  const agent = new Agent({
    name: "Agent commerce policy compiler",
    model: process.env.OPENAI_AGENT_MODEL ?? "gpt-5.6",
    instructions: [
      "Compile natural-language selling instructions into a conservative deterministic policy.",
      "Never reduce the supplied minimum price or increase the supplied maximum discount.",
      "Preserve the supplied product, resource, base price, currency, and settlement method exactly.",
      "Use zero when no volume threshold is stated and 1000 when no approval amount is stated.",
    ].join(" "),
    outputType: sellingPolicySchema,
  });
  try {
    const result = await run(agent, JSON.stringify(input));
    if (!result.finalOutput) return fallback;
    const output = result.finalOutput;
    if (output.minimumPrice < input.minimumPrice || output.maximumDiscountPercent > input.maximumDiscountPercent) return fallback;
    return { ...output, product: input.product, resource: input.resource, basePrice: input.basePrice, currency: input.currency, settlement: input.settlement, source: "openai-agent" };
  } catch { return fallback; }
}
