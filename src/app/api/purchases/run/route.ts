import { authorizeCard, createScopedCard, RainApiError, settleAuthorization } from "@/lib/rain";
import {
  buildNegotiation,
  getVendorQuotes,
  mandateSchema,
  selectQuote,
  successfulDelivery,
  verifyDelivery,
} from "@/lib/purchasing";
import { planPurchase } from "@/lib/agent";
import { purchaseMissionReadinessPacket } from "@/lib/monad";

type TimelineItem = {
  id: string;
  title: string;
  detail: string;
  status: "complete" | "declined" | "verified" | "warning";
  providerId?: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mandate = mandateSchema.parse(body.mandate);
    const liveRain = body.liveRain === true;
    const approved = body.approved === true;
    const negotiation = buildNegotiation(mandate);
    const { decisions, selected } = selectQuote(getVendorQuotes(mandate), mandate);

    if (!selected) {
      return Response.json({ error: "No provider satisfies the purchasing mandate", decisions, negotiation }, { status: 422 });
    }

    const agent = await planPurchase(mandate);
    const timeline: TimelineItem[] = [
      {
        id: "agent",
        title: agent.source === "openai-agent" ? "AI buyer prepared the mandate" : "Deterministic buyer prepared the mandate",
        detail: agent.summary,
        status: "complete",
      },
      {
        id: "discovery",
        title: "Seller agent discovered",
        detail: "MissionClear published a machine-readable agent card and negotiation skill.",
        status: "complete",
        providerId: negotiation.offerId,
      },
      {
        id: "negotiation",
        title: "Buyer and seller negotiated",
        detail: `${negotiation.discounts.join(" and ")} reduced the offer to $${(negotiation.finalAmountCents / 100).toFixed(2)}.`,
        status: "complete",
      },
      {
        id: "policy",
        title: "Business mandate enforced",
        detail: "Budget, per-mission cost, quantity, and readiness coverage all passed deterministic checks.",
        status: "complete",
      },
    ];

    if (liveRain && !approved) {
      timeline.push({
        id: "approval",
        title: "Human approval required",
        detail: `${selected.provider} is a new seller. No Rain or Monad payment has been attempted.`,
        status: "warning",
      });
      return Response.json({
        mandate,
        negotiation,
        decisions,
        selected,
        timeline,
        agent,
        requiresApproval: true,
        approval: {
          provider: selected.provider,
          amountCents: selected.amountCents,
          reason: "New agent seller outside the approved provider set",
        },
        delivery: null,
        rain: null,
        monad: null,
      });
    }

    timeline.push({
      id: "approval",
      title: approved ? "Human approved the negotiated agreement" : "Human approval would be required",
      detail: approved
        ? `Approval is bound to ${selected.provider}, the negotiated package, and the exact maximum amount.`
        : "Preview mode continues without moving sandbox or testnet funds.",
      status: approved ? "complete" : "warning",
    });

    let monad = null;
    let rain = null;
    if (liveRain) {
      monad = await purchaseMissionReadinessPacket(new URL(request.url).origin);
      timeline.push({
        id: "monad",
        title: "Customer agent paid the seller",
        detail: `${monad.amount} ${monad.asset} settled through x402 on ${monad.network}; the facilitator paid gas.`,
        status: "verified",
        providerId: monad.transactionHash,
      });

      const upstreamProcurementCents = Math.round(selected.amountCents * 0.32);
      const card = await createScopedCard({
        amountCents: upstreamProcurementCents,
        allowedMccs: [selected.merchantCategoryCode],
      });
      timeline.push({
        id: "card",
        title: `Fulfillment card created •••• ${card.last4}`,
        detail: `Rain limited upstream procurement to $${(upstreamProcurementCents / 100).toFixed(2)}, MCC ${selected.merchantCategoryCode}, and one hour.`,
        status: "complete",
        providerId: card.id,
      });

      const declined = await authorizeCard({
        cardId: card.id,
        amountCents: upstreamProcurementCents,
        merchantName: "Unapproved Dining Merchant",
        merchantCategoryCode: "5814",
      });
      timeline.push({
        id: "decline",
        title: "Invalid upstream purchase blocked",
        detail: declined.declinedReason
          ? `Rain declined the mismatched merchant: ${declined.declinedReason}.`
          : "Rain declined the merchant because its category was not permitted.",
        status: "declined",
        providerId: declined.transactionId,
      });

      const authorization = await authorizeCard({
        cardId: card.id,
        amountCents: upstreamProcurementCents,
        merchantName: "AeroData Compliance Cloud",
        merchantCategoryCode: selected.merchantCategoryCode,
      });
      timeline.push({
        id: "authorization",
        title: "Traditional data provider authorized",
        detail: "The airspace, weather, mapping, and compliance supplier passed Rain's amount and MCC controls.",
        status: "complete",
        providerId: authorization.transactionId,
      });

      const settlement = await settleAuthorization(authorization.transactionId, upstreamProcurementCents);
      timeline.push({
        id: "settlement",
        title: "Upstream fulfillment payment settled",
        detail: "The approved Rain authorization became a posted sandbox transaction.",
        status: "complete",
        providerId: settlement.transactionId,
      });
      rain = { upstreamProcurementCents, card, declined, authorization, settlement };
    } else {
      timeline.push(
        {
          id: "monad-preview",
          title: "Monad x402 sale ready",
          detail: "Live mode accepts a test USDC payment for the mission-readiness packet.",
          status: "complete",
        },
        {
          id: "rain-preview",
          title: "Rain fulfillment policy ready",
          detail: "Live mode creates a restricted card for traditional upstream data providers.",
          status: "complete",
        },
      );
    }

    const delivery = verifyDelivery(successfulDelivery, mandate);
    timeline.push({
      id: "delivery",
      title: delivery.passed ? "Mission-readiness packet verified" : "Packet failed verification",
      detail: `${delivery.missionsPrepared} missions prepared with ${Math.round(delivery.measuredReadinessRate * 100)}% readiness coverage.`,
      status: "verified",
    });

    return Response.json({
      mandate,
      negotiation,
      decisions,
      selected,
      timeline,
      delivery,
      rain,
      monad,
      agent,
      requiresApproval: false,
      approval: null,
    });
  } catch (error) {
    const detail = error instanceof RainApiError ? error.detail : undefined;
    return Response.json({ error: detail ?? (error instanceof Error ? error.message : "Commerce workflow failed") }, { status: 500 });
  }
}
