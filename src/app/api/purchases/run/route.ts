import {
  authorizeCard,
  createScopedCard,
  RainApiError,
  settleAuthorization,
} from "@/lib/rain";
import {
  mandateSchema,
  selectQuote,
  successfulDelivery,
  vendorQuotes,
  verifyDelivery,
} from "@/lib/purchasing";

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
    const { decisions, selected } = selectQuote(vendorQuotes, mandate);

    if (!selected) {
      return Response.json(
        { error: "No provider satisfies the purchasing mandate", decisions },
        { status: 422 },
      );
    }

    const timeline: TimelineItem[] = [
      {
        id: "mandate",
        title: "Mandate approved",
        detail: `Budget and delivery rules converted into enforceable policy.`,
        status: "complete",
      },
      {
        id: "selection",
        title: `${selected.provider} selected`,
        detail: `Lowest-priced offer satisfying every business requirement.`,
        status: "complete",
        providerId: selected.id,
      },
    ];

    let rain;
    if (liveRain) {
      timeline.push({
        id: "collateral",
        title: "Existing Rain collateral selected",
        detail: "Using the account's provisioned sandbox capacity without adding new funds.",
        status: "complete",
      });

      const card = await createScopedCard({
        amountCents: selected.amountCents,
        allowedMccs: [selected.merchantCategoryCode],
      });
      timeline.push({
        id: "card",
        title: `Scoped Rain card •••• ${card.last4}`,
        detail: `Limited to the selected amount, MCC ${selected.merchantCategoryCode}, and one hour.`,
        status: "complete",
        providerId: card.id,
      });

      const declined = await authorizeCard({
        cardId: card.id,
        amountCents: selected.amountCents,
        merchantName: "Unapproved Dining Merchant",
        merchantCategoryCode: "5814",
      });
      timeline.push({
        id: "decline",
        title: "Invalid purchase blocked",
        detail: declined.declinedReason
          ? `Rain declined the mismatched merchant: ${declined.declinedReason}.`
          : "Rain declined the merchant because its category was not permitted.",
        status: "declined",
        providerId: declined.transactionId,
      });

      const authorization = await authorizeCard({
        cardId: card.id,
        amountCents: selected.amountCents,
        merchantName: selected.provider,
        merchantCategoryCode: selected.merchantCategoryCode,
      });
      timeline.push({
        id: "authorization",
        title: "Approved purchase authorized",
        detail: `${selected.provider} passed Rain's amount and merchant controls.`,
        status: "complete",
        providerId: authorization.transactionId,
      });

      const settlement = await settleAuthorization(
        authorization.transactionId,
        selected.amountCents,
      );
      timeline.push({
        id: "settlement",
        title: "Payment settled",
        detail: "The approved authorization became a posted Rain transaction.",
        status: "complete",
        providerId: settlement.transactionId,
      });

      rain = { card, declined, authorization, settlement };
    } else {
      timeline.push(
        {
          id: "card-preview",
          title: "Scoped card policy prepared",
          detail: `Would allow ${selected.provider}, MCC ${selected.merchantCategoryCode}, for the selected amount only.`,
          status: "complete",
        },
        {
          id: "decline-preview",
          title: "Invalid purchase blocked",
          detail: "Demo mode shows the expected MCC policy decline without moving sandbox state.",
          status: "declined",
        },
        {
          id: "settlement-preview",
          title: "Approved payment ready",
          detail: "Switch on Live Rain to create, authorize, and settle the sandbox card.",
          status: "complete",
        },
      );
    }

    const delivery = verifyDelivery(successfulDelivery, mandate);
    timeline.push({
      id: "delivery",
      title: delivery.passed ? "Delivery verified" : "Delivery failed verification",
      detail: `${delivery.deliveredRecords} records received; ${Math.round(delivery.measuredQualityRate * 100)}% measured quality.`,
      status: "verified",
    });

    return Response.json({ mandate, decisions, selected, timeline, delivery, rain });
  } catch (error) {
    const detail = error instanceof RainApiError ? error.detail : undefined;
    return Response.json(
      {
        error: detail ?? (error instanceof Error ? error.message : "Purchase workflow failed"),
      },
      { status: 500 },
    );
  }
}
