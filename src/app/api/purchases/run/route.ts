import { authorizeCard, createScopedCard, getTransaction, RainApiError, settleAuthorization } from "@/lib/rain";
import {
  mandateSchema,
  successfulDelivery,
  verifyDelivery,
} from "@/lib/purchasing";
import { planPurchase } from "@/lib/agent";
import { purchaseMissionReadinessPacket } from "@/lib/monad";
import { negotiateThroughA2A } from "@/lib/a2a-client";
import { createOfficialAp2Authorization, verifyOfficialAp2Authorization } from "@/lib/ap2";

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
    const origin = new URL(request.url).origin;
    const a2a = await negotiateThroughA2A(origin, mandate);
    const { negotiation, decisions, selected } = a2a;

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
        title: "A2A seller agent discovered",
        detail: `The buyer fetched an official A2A ${a2a.protocolVersion} Agent Card and selected its negotiation skill.`,
        status: "complete",
        providerId: a2a.taskId,
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
        a2a: { protocolVersion: a2a.protocolVersion, taskId: a2a.taskId, contextId: a2a.contextId },
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
    let ap2 = null;
    if (liveRain) {
      const saleAuthorization = await createOfficialAp2Authorization({
        buyerId: "preflight-customer",
        agentId: "preflight-purchasing-agent",
        merchantId: "missionclear-agent",
        merchantName: selected.provider,
        merchantWebsite: origin,
        sku: "mission-readiness-verification",
        title: "Mission-readiness verification resource",
        quantity: 1,
        amountCents: 1,
        maximumCents: 1,
        currency: "USD",
        paymentInstrument: "x402-usdc",
        paymentDescription: "Monad Testnet USDC through x402",
      });
      timeline.push({
        id: "ap2-sale",
        title: "Official AP2 sale authorization verified",
        detail: "The buyer's open and closed Payment Mandates and the merchant-signed Checkout Mandate authorize the exact $0.01 x402 test settlement.",
        status: "verified",
        providerId: saleAuthorization.authorizationId,
      });

      monad = await purchaseMissionReadinessPacket(origin, saleAuthorization.authorizationId);
      timeline.push({
        id: "monad",
        title: "Customer agent paid the seller",
        detail: `${monad.amount} ${monad.asset} settled through x402 on ${monad.network}; the facilitator paid gas.`,
        status: "verified",
        providerId: monad.transactionHash,
      });

      const upstreamProcurementCents = Math.round(selected.amountCents * 0.32);
      const procurementAuthorization = await createOfficialAp2Authorization({
        buyerId: "missionclear-fulfillment",
        agentId: "missionclear-fulfillment-agent",
        merchantId: "aerodata-compliance-cloud",
        merchantName: "AeroData Compliance Cloud",
        merchantWebsite: "https://example.com/aerodata",
        sku: "upstream-readiness-data",
        title: "Airspace, weather, mapping, and compliance data",
        quantity: 1,
        amountCents: upstreamProcurementCents,
        maximumCents: upstreamProcurementCents,
        currency: "USD",
        paymentInstrument: "rain-card",
        paymentDescription: "Rain scoped virtual card",
      });
      timeline.push({
        id: "ap2-procurement",
        title: "Official AP2 procurement authorization verified",
        detail: `MissionClear's fulfillment agent is authorized to spend exactly $${(upstreamProcurementCents / 100).toFixed(2)} with AeroData using a Rain card.`,
        status: "verified",
        providerId: procurementAuthorization.authorizationId,
      });

      const verifiedProcurement = await verifyOfficialAp2Authorization(
        procurementAuthorization.authorizationId,
      );
      if (
        verifiedProcurement.merchantId !== "aerodata-compliance-cloud" ||
        verifiedProcurement.paymentInstrument !== "rain-card" ||
        verifiedProcurement.amountCents !== upstreamProcurementCents
      ) {
        throw new Error("AP2 mandate does not authorize this Rain procurement");
      }

      const card = await createScopedCard({
        amountCents: upstreamProcurementCents,
        allowedMccs: [selected.merchantCategoryCode],
      });
      timeline.push({
        id: "card",
        title: `Fulfillment card ending in ${card.last4} created`,
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
      const transaction = await getTransaction(settlement.transactionId);
      timeline.push({
        id: "transaction",
        title: "Posted Rain transaction retrieved",
        detail: `Rain returned the final ${transaction.type} record for ${transaction.spend?.merchantName ?? "the approved upstream provider"}.`,
        status: "verified",
        providerId: transaction.id,
      });
      rain = { upstreamProcurementCents, card, declined, authorization, settlement, transaction };
      ap2 = { sale: saleAuthorization, procurement: procurementAuthorization };
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
      a2a: { protocolVersion: a2a.protocolVersion, taskId: a2a.taskId, contextId: a2a.contextId },
      negotiation,
      decisions,
      selected,
      timeline,
      delivery,
      rain,
      monad,
      ap2,
      agent,
      requiresApproval: false,
      approval: null,
    });
  } catch (error) {
    const detail = error instanceof RainApiError ? error.detail : undefined;
    return Response.json({ error: detail ?? (error instanceof Error ? error.message : "Commerce workflow failed") }, { status: 500 });
  }
}
