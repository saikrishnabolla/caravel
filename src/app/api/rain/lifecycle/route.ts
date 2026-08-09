import {
  authorizeCard,
  createScopedCard,
  getTransaction,
  RainApiError,
  refundTransaction,
  reverseAuthorization,
  settleAuthorization,
} from "@/lib/rain";
import { createOfficialAp2Authorization, verifyOfficialAp2Authorization } from "@/lib/ap2";

export async function POST(request: Request) {
  try {
    const origin = new URL(request.url).origin;
    const steps: Array<{ title: string; detail: string; status: string; id?: string }> = [];

    const permission = await createOfficialAp2Authorization({
      buyerId: "preflight-operations",
      agentId: "preflight-procurement-agent",
      merchantId: "aerodata-sandbox",
      merchantName: "AeroData Sandbox Provider",
      merchantWebsite: origin,
      sku: "airspace-weather-data",
      title: "Airspace, weather, and compliance data",
      quantity: 1,
      amountCents: 2_000,
      maximumCents: 2_000,
      currency: "USD",
      paymentInstrument: "rain-card",
      paymentDescription: "Rain scoped virtual card",
    });
    const verified = await verifyOfficialAp2Authorization(permission.authorizationId);
    steps.push({ title: "AP2 procurement mandate verified", detail: "The fulfillment agent may spend exactly $20.00 with the approved provider using a Rain card.", status: "verified", id: verified.authorizationId });

    const settlementCard = await createScopedCard({ amountCents: 2_000, allowedMccs: ["5734"] });
    steps.push({ title: "Scoped card created", detail: `Card ending in ${settlementCard.last4} is limited to $20.00, MCC 5734, and one hour.`, status: settlementCard.status, id: settlementCard.id });

    const declined = await authorizeCard({ cardId: settlementCard.id, amountCents: 2_000, merchantName: "Unapproved Dining Merchant", merchantCategoryCode: "5814" });
    steps.push({ title: "Invalid merchant declined", detail: declined.declinedReason ?? "The merchant category was outside the card policy.", status: declined.status, id: declined.transactionId });

    const reversalCard = await createScopedCard({ amountCents: 500, allowedMccs: ["5734"] });
    const reversible = await authorizeCard({ cardId: reversalCard.id, amountCents: 500, merchantName: "AeroData Sandbox Provider", merchantCategoryCode: "5734" });
    steps.push({ title: "Reversible authorization created", detail: "A separate $5.00 authorization demonstrates cancellation before settlement.", status: reversible.status, id: reversible.transactionId });

    const reversed = await reverseAuthorization(reversible.transactionId, 0);
    steps.push({ title: "Authorization reversed", detail: "Rain released the open authorization without creating a posted purchase.", status: reversed.status, id: reversed.transactionId });

    const authorization = await authorizeCard({ cardId: settlementCard.id, amountCents: 2_000, merchantName: "AeroData Sandbox Provider", merchantCategoryCode: "5734" });
    steps.push({ title: "Approved provider authorized", detail: "The amount, merchant purpose, and MCC satisfied the AP2 and Rain controls.", status: authorization.status, id: authorization.transactionId });

    const settlement = await settleAuthorization(authorization.transactionId, 2_000);
    steps.push({ title: "Authorization settled", detail: "The valid authorization became a posted sandbox transaction.", status: settlement.status, id: settlement.transactionId });

    const transaction = await getTransaction(settlement.transactionId);
    steps.push({ title: "Final transaction fetched", detail: `Rain returned the posted ${transaction.type} transaction for ${transaction.spend?.merchantName ?? "the approved provider"}.`, status: "retrieved", id: transaction.id });

    const refund = await refundTransaction(settlement.transactionId, 2_000);
    steps.push({ title: "Settled transaction refunded", detail: "Rain created a sandbox credit for the complete $20.00 settlement.", status: refund.completionReason ?? refund.status, id: refund.transactionId });

    return Response.json({ title: "Rain card transaction lifecycle", steps });
  } catch (error) {
    const detail = error instanceof RainApiError ? error.detail : undefined;
    return Response.json({ error: detail ?? (error instanceof Error ? error.message : "Rain lifecycle proof failed") }, { status: 500 });
  }
}
