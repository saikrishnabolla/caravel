import { Agent, run } from "@openai/agents";
import { z } from "zod";

export const parsedMandateSchema = z.object({
  objective: z.string().min(1),
  budgetCents: z.number().int().positive(),
  maxUnitCostCents: z.number().int().positive(),
  minimumMissions: z.number().int().positive(),
  minimumReadinessRate: z.number().min(0).max(1),
  geography: z.string().min(1),
  categories: z.array(z.string()).min(1),
  requiresApproval: z.boolean(),
});

export type ParsedMandate = z.infer<typeof parsedMandateSchema> & {
  source: "openai-agent" | "deterministic-fallback";
};

function amountFromText(request: string, fallback: number) {
  const matches = [...request.matchAll(/\$\s?([\d,]+(?:\.\d{1,2})?)/g)];
  const value = matches.at(-1)?.[1];
  return value ? Math.round(Number(value.replaceAll(",", "")) * 100) : fallback;
}

function quantityFromText(request: string, fallback: number) {
  const matches = [...request.matchAll(/\b(\d{1,5})\s+(?:qualified\s+)?(?:companies|organizations|accounts|contacts|reports|results|packets|calls)\b/gi)];
  const value = matches.at(-1)?.[1];
  return value ? Number(value) : fallback;
}

function deterministicMandate(request: string): ParsedMandate {
  const budgetCents = amountFromText(request, 30_000);
  const minimumMissions = quantityFromText(request, 100);
  const lower = request.toLowerCase();
  const categories = [
    lower.includes("contact") || lower.includes("company") ? "go-to-market data" : null,
    lower.includes("airspace") || lower.includes("laanc") ? "airspace" : null,
    lower.includes("weather") ? "weather" : null,
    lower.includes("telemetry") ? "telemetry" : null,
  ].filter((value): value is string => Boolean(value));

  return {
    objective: request.trim(),
    budgetCents,
    maxUnitCostCents: Math.max(1, Math.floor(budgetCents / minimumMissions)),
    minimumMissions,
    minimumReadinessRate: 0.9,
    geography: lower.includes("united states") || lower.includes("u.s.") ? "United States" : "Configured operating region",
    categories: categories.length > 0 ? categories : ["business service"],
    requiresApproval: lower.includes("approval") || lower.includes("new vendor"),
    source: "deterministic-fallback",
  };
}

export async function parseBusinessMandate(request: string): Promise<ParsedMandate> {
  const fallback = deterministicMandate(request);
  const openAIKey = process.env.OPENAI_API_KEY ?? process.env.openai_key;
  if (!openAIKey) return fallback;
  if (!process.env.OPENAI_API_KEY) process.env.OPENAI_API_KEY = openAIKey;

  const agent = new Agent({
    name: "Business purchasing mandate parser",
    model: process.env.OPENAI_AGENT_MODEL ?? "gpt-5.6",
    instructions: [
      "Convert the user's purchasing request into a conservative business mandate.",
      "Never increase a stated budget or reduce a stated quantity.",
      "Use cents for monetary fields.",
      "Set requiresApproval when the request mentions new vendors, human review, or unfamiliar providers.",
      "Use a 0.9 readiness rate when the user does not state a quality threshold.",
    ].join(" "),
    outputType: parsedMandateSchema,
  });

  try {
    const result = await run(agent, request);
    if (!result.finalOutput) return fallback;
    return { ...result.finalOutput, source: "openai-agent" };
  } catch {
    return fallback;
  }
}
