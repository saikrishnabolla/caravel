import { z } from "zod";

export const mandateSchema = z.object({
  objective: z.string().trim().min(10).max(240),
  budgetCents: z.number().int().min(100).max(500_000),
  maxUnitCostCents: z.number().int().min(1).max(100_000),
  minimumRecords: z.number().int().min(1).max(100_000),
  minimumQualityRate: z.number().min(0.5).max(1),
});

export type Mandate = z.infer<typeof mandateSchema>;

export type VendorQuote = {
  id: string;
  provider: string;
  description: string;
  amountCents: number;
  unitCostCents: number;
  recordCount: number;
  expectedQualityRate: number;
  merchantCategoryCode: string;
};

export type QuoteDecision = VendorQuote & {
  eligible: boolean;
  reasons: string[];
};

export type DeliveryEvidence = {
  deliveredRecords: number;
  duplicateRecords: number;
  completeRecords: number;
  measuredQualityRate: number;
};

export type DeliveryVerification = DeliveryEvidence & {
  passed: boolean;
  checks: Array<{ label: string; passed: boolean; detail: string }>;
};

export const vendorQuotes: VendorQuote[] = [
  {
    id: "deepline",
    provider: "Deepline Data",
    description: "Verified campaign contacts with company and role enrichment",
    amountCents: 3200,
    unitCostCents: 32,
    recordCount: 100,
    expectedQualityRate: 0.94,
    merchantCategoryCode: "5734",
  },
  {
    id: "clay-workflow",
    provider: "Clay Workflow Studio",
    description: "Managed enrichment workflow with premium data providers",
    amountCents: 4800,
    unitCostCents: 48,
    recordCount: 100,
    expectedQualityRate: 0.97,
    merchantCategoryCode: "5734",
  },
  {
    id: "apollo-export",
    provider: "Apollo Export",
    description: "Existing account export with limited verification for this segment",
    amountCents: 1900,
    unitCostCents: 19,
    recordCount: 100,
    expectedQualityRate: 0.82,
    merchantCategoryCode: "7399",
  },
];

export const successfulDelivery: DeliveryEvidence = {
  deliveredRecords: 102,
  duplicateRecords: 2,
  completeRecords: 100,
  measuredQualityRate: 0.94,
};

export function evaluateQuote(quote: VendorQuote, mandate: Mandate): QuoteDecision {
  const reasons: string[] = [];

  if (quote.amountCents > mandate.budgetCents) {
    reasons.push("Total price exceeds the approved budget");
  }
  if (quote.unitCostCents > mandate.maxUnitCostCents) {
    reasons.push("Unit price exceeds the approved maximum");
  }
  if (quote.recordCount < mandate.minimumRecords) {
    reasons.push("Offer does not include enough records");
  }
  if (quote.expectedQualityRate < mandate.minimumQualityRate) {
    reasons.push("Expected quality is below the required threshold");
  }

  return { ...quote, eligible: reasons.length === 0, reasons };
}

export function selectQuote(quotes: VendorQuote[], mandate: Mandate) {
  const decisions = quotes.map((quote) => evaluateQuote(quote, mandate));
  const selected = decisions
    .filter((quote) => quote.eligible)
    .sort((a, b) => a.amountCents - b.amountCents)[0];

  return { decisions, selected: selected ?? null };
}

export function verifyDelivery(
  evidence: DeliveryEvidence,
  mandate: Mandate,
): DeliveryVerification {
  const uniqueRecords = evidence.deliveredRecords - evidence.duplicateRecords;
  const checks = [
    {
      label: "Minimum quantity",
      passed: uniqueRecords >= mandate.minimumRecords,
      detail: `${uniqueRecords} unique records delivered`,
    },
    {
      label: "Required fields",
      passed: evidence.completeRecords >= mandate.minimumRecords * 0.95,
      detail: `${evidence.completeRecords} records contain every required field`,
    },
    {
      label: "Quality threshold",
      passed: evidence.measuredQualityRate >= mandate.minimumQualityRate,
      detail: `${Math.round(evidence.measuredQualityRate * 100)}% measured quality`,
    },
  ];

  return {
    ...evidence,
    passed: checks.every((check) => check.passed),
    checks,
  };
}

export function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
