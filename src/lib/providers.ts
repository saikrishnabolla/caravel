import type { ParsedMandate } from "./mandate";

export type CommerceProvider = {
  id: string;
  name: string;
  kind: "A2A provider" | "x402 API" | "Traditional vendor";
  payment: "Monad x402" | "Rain scoped card";
  approved: boolean;
  reputation: number;
  samplePriceCents: number;
  freshness: string;
};

export function discoverProviders(mandate: ParsedMandate): CommerceProvider[] {
  const gtm = mandate.categories.some(category => /company|contact|go-to-market|lead/i.test(category));
  const providers: CommerceProvider[] = gtm ? [
    { id: "signal-grid", name: "SignalGrid", kind: "x402 API", payment: "Monad x402", approved: true, reputation: 94, samplePriceCents: 1, freshness: "updated today" },
    { id: "clay", name: "Clay", kind: "Traditional vendor", payment: "Rain scoped card", approved: true, reputation: 91, samplePriceCents: 1500, freshness: "provider reported" },
    { id: "apollo", name: "Apollo", kind: "Traditional vendor", payment: "Rain scoped card", approved: true, reputation: 88, samplePriceCents: 1200, freshness: "provider reported" },
    { id: "new-a2a-data", name: "Aerial Markets Agent", kind: "A2A provider", payment: "Monad x402", approved: false, reputation: 76, samplePriceCents: 5, freshness: "sample required" },
  ] : [
    { id: "missionclear", name: "MissionClear", kind: "A2A provider", payment: "Monad x402", approved: true, reputation: 96, samplePriceCents: 1, freshness: "live test endpoint" },
    { id: "airspace-provider", name: "Approved Airspace Provider", kind: "Traditional vendor", payment: "Rain scoped card", approved: true, reputation: 93, samplePriceCents: 500, freshness: "operational feed" },
    { id: "weather-provider", name: "Aviation Weather Provider", kind: "x402 API", payment: "Monad x402", approved: false, reputation: 82, samplePriceCents: 2, freshness: "sample required" },
  ];

  return providers.sort((a, b) => Number(b.approved) - Number(a.approved) || b.reputation - a.reputation);
}
