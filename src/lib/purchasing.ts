import { z } from "zod";

export const mandateSchema = z.object({
  objective: z.string().trim().min(10).max(320),
  budgetCents: z.number().int().min(100).max(500_000),
  maxUnitCostCents: z.number().int().min(1).max(100_000),
  minimumMissions: z.number().int().min(1).max(10_000),
  minimumReadinessRate: z.number().min(0.5).max(1),
});

export type Mandate = z.infer<typeof mandateSchema>;

export type VendorQuote = {
  id: string;
  provider: string;
  description: string;
  amountCents: number;
  unitCostCents: number;
  missionCount: number;
  expectedReadinessRate: number;
  merchantCategoryCode: string;
};

export type QuoteDecision = VendorQuote & {
  eligible: boolean;
  reasons: string[];
};

export type NegotiationTurn = {
  actor: "buyer" | "seller";
  message: string;
  amountCents?: number;
};

export type Negotiation = {
  protocol: "A2A-ready structured negotiation";
  offerId: string;
  turns: NegotiationTurn[];
  discounts: string[];
  finalAmountCents: number;
};

export type DeliveryEvidence = {
  missionsPrepared: number;
  airspaceChecks: number;
  weatherChecks: number;
  complianceChecks: number;
  measuredReadinessRate: number;
};

export type DeliveryVerification = DeliveryEvidence & {
  passed: boolean;
  checks: Array<{ label: string; passed: boolean; detail: string }>;
};

export function buildNegotiation(mandate: Mandate): Negotiation {
  const standardAmount = mandate.minimumMissions * 1_800;
  const volumeAmount = Math.round(standardAmount * (mandate.minimumMissions >= 100 ? 0.85 : 0.92));
  const seasonalAmount = Math.floor(volumeAmount * 0.95 / 1_000) * 1_000;

  return {
    protocol: "A2A-ready structured negotiation",
    offerId: `missionclear-${mandate.minimumMissions}-seasonal`,
    turns: [
      {
        actor: "buyer",
        message: `We need ${mandate.minimumMissions} agricultural mission-readiness packets with airspace, weather, regulatory, risk, and telemetry coverage. Our maximum is ${formatUsd(mandate.budgetCents)}.`,
      },
      {
        actor: "seller",
        message: `Standard pricing is ${formatUsd(standardAmount)} for ${mandate.minimumMissions} missions.`,
        amountCents: standardAmount,
      },
      {
        actor: "buyer",
        message: `That exceeds our mandate. Apply volume pricing and include a seasonal commitment with 90-day telemetry retention.`,
      },
      {
        actor: "seller",
        message: `With the volume and seasonal discounts, the complete package is ${formatUsd(seasonalAmount)}.`,
        amountCents: seasonalAmount,
      },
      {
        actor: "buyer",
        message: seasonalAmount <= mandate.budgetCents
          ? "Accepted within the purchasing mandate, pending human approval."
          : "Rejected because the final offer remains above the purchasing mandate.",
      },
    ],
    discounts: ["100+ mission volume pricing", "seasonal commitment"],
    finalAmountCents: seasonalAmount,
  };
}

export function getVendorQuotes(mandate: Mandate): VendorQuote[] {
  const negotiation = buildNegotiation(mandate);
  const missions = mandate.minimumMissions;

  return [
    {
      id: "missionclear-agent",
      provider: "MissionClear Agent",
      description: "Negotiated airspace, weather, Part 107/137 readiness, risk, and telemetry package",
      amountCents: negotiation.finalAmountCents,
      unitCostCents: Math.round(negotiation.finalAmountCents / missions),
      missionCount: missions,
      expectedReadinessRate: 0.96,
      merchantCategoryCode: "5734",
    },
    {
      id: "enterprise-ops-suite",
      provider: "Enterprise UAS Operations Suite",
      description: "Premium mission-planning subscription with managed compliance support",
      amountCents: missions * 1_780,
      unitCostCents: 1_780,
      missionCount: missions,
      expectedReadinessRate: 0.98,
      merchantCategoryCode: "5734",
    },
    {
      id: "manual-compliance-desk",
      provider: "Manual Compliance Desk",
      description: "Low-cost manual review without complete weather and telemetry evidence",
      amountCents: missions * 1_200,
      unitCostCents: 1_200,
      missionCount: missions,
      expectedReadinessRate: 0.82,
      merchantCategoryCode: "7399",
    },
  ];
}

export const successfulDelivery: DeliveryEvidence = {
  missionsPrepared: 100,
  airspaceChecks: 100,
  weatherChecks: 100,
  complianceChecks: 96,
  measuredReadinessRate: 0.96,
};

export function evaluateQuote(quote: VendorQuote, mandate: Mandate): QuoteDecision {
  const reasons: string[] = [];

  if (quote.amountCents > mandate.budgetCents) reasons.push("Total price exceeds the approved budget");
  if (quote.unitCostCents > mandate.maxUnitCostCents) reasons.push("Per-mission price exceeds the approved maximum");
  if (quote.missionCount < mandate.minimumMissions) reasons.push("Offer does not cover enough missions");
  if (quote.expectedReadinessRate < mandate.minimumReadinessRate) reasons.push("Expected readiness coverage is below the required threshold");

  return { ...quote, eligible: reasons.length === 0, reasons };
}

export function selectQuote(quotes: VendorQuote[], mandate: Mandate) {
  const decisions = quotes.map(quote => evaluateQuote(quote, mandate));
  const selected = decisions.filter(quote => quote.eligible).sort((a, b) => a.amountCents - b.amountCents)[0];
  return { decisions, selected: selected ?? null };
}

export function verifyDelivery(evidence: DeliveryEvidence, mandate: Mandate): DeliveryVerification {
  const checks = [
    {
      label: "Mission coverage",
      passed: evidence.missionsPrepared >= mandate.minimumMissions,
      detail: `${evidence.missionsPrepared} mission packets prepared`,
    },
    {
      label: "Airspace and weather",
      passed: evidence.airspaceChecks >= mandate.minimumMissions && evidence.weatherChecks >= mandate.minimumMissions,
      detail: `${evidence.airspaceChecks} airspace and ${evidence.weatherChecks} weather checks completed`,
    },
    {
      label: "Readiness threshold",
      passed: evidence.measuredReadinessRate >= mandate.minimumReadinessRate,
      detail: `${Math.round(evidence.measuredReadinessRate * 100)}% measured readiness coverage`,
    },
  ];

  return { ...evidence, passed: checks.every(check => check.passed), checks };
}

export function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
