import { createOfficialAp2Authorization, verifyOfficialAp2Authorization } from "@/lib/ap2";
import { authorizeCard, createScopedCard, fundCollateral, getTransaction, RainApiError, settleAuthorization } from "@/lib/rain";

const product = {
  id: "8672470859932",
  variantId: "45973831614620",
  name: "XAG P150 MAX Starter Kit (7Kw 2B2C)",
  merchant: "Raptor Dynamic",
  merchantId: "raptor-dynamic",
  productUrl: "https://raptordynamic.com/products/xag-p150-max",
  catalogUrl: "https://raptordynamic.com/collections/xag-drones/products.json?limit=250",
  amountCents: 2_890_000,
  merchantCategoryCode: "5085",
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as { approved?: boolean };
    if (!body.approved) return Response.json({ requiresApproval: true, product, reason: "High-value equipment purchases require human approval before Rain card issuance" });

    const authorization = await createOfficialAp2Authorization({
      buyerId: "preflight-operations",
      agentId: "preflight-procurement-agent",
      merchantId: product.merchantId,
      merchantName: product.merchant,
      merchantWebsite: product.productUrl,
      sku: `shopify-variant-${product.variantId}`,
      title: product.name,
      quantity: 1,
      amountCents: product.amountCents,
      maximumCents: product.amountCents,
      currency: "USD",
      paymentInstrument: "rain-card",
      paymentDescription: "Rain scoped virtual card for one approved Shopify product",
    });
    const verified = await verifyOfficialAp2Authorization(authorization.authorizationId);
    if (verified.merchantId !== product.merchantId || verified.amountCents !== product.amountCents || verified.paymentInstrument !== "rain-card") throw new Error("AP2 authorization does not match the high-ticket purchase");

    const collateral = await fundCollateral(product.amountCents);
    const card = await createScopedCard({ amountCents: product.amountCents, allowedMccs: [product.merchantCategoryCode] });
    const cardAuthorization = await authorizeCard({ cardId: card.id, amountCents: product.amountCents, merchantName: product.merchant, merchantCategoryCode: product.merchantCategoryCode });
    if (cardAuthorization.status === "declined") {
      const depositCents = 50_000;
      const depositAuthorization = await createOfficialAp2Authorization({
        buyerId: "preflight-operations",
        agentId: "preflight-procurement-agent",
        merchantId: product.merchantId,
        merchantName: product.merchant,
        merchantWebsite: product.productUrl,
        sku: `shopify-variant-${product.variantId}-deposit`,
        title: `${product.name} reservation deposit against a $${(product.amountCents / 100).toLocaleString()} order`,
        quantity: 1,
        amountCents: depositCents,
        maximumCents: depositCents,
        currency: "USD",
        paymentInstrument: "rain-card",
        paymentDescription: "Rain scoped virtual card for a high-value equipment reservation deposit",
      });
      await verifyOfficialAp2Authorization(depositAuthorization.authorizationId);
      await fundCollateral(depositCents);
      const depositCard = await createScopedCard({ amountCents: depositCents, allowedMccs: [product.merchantCategoryCode] });
      const depositCardAuthorization = await authorizeCard({ cardId: depositCard.id, amountCents: depositCents, merchantName: product.merchant, merchantCategoryCode: product.merchantCategoryCode });
      if (depositCardAuthorization.status === "declined") return Response.json({ error: `Rain declined both the full amount and reservation deposit: ${depositCardAuthorization.declinedReason ?? "unknown reason"}`, requiresApproval: false, product, fullPurchaseAuthorizationId: authorization.authorizationId, fullAmountAttempt: cardAuthorization, depositAuthorizationId: depositAuthorization.authorizationId, depositAttempt: depositCardAuthorization }, { status: 409 });
      const depositSettlement = depositCardAuthorization.status === "settled" ? depositCardAuthorization : await settleAuthorization(depositCardAuthorization.transactionId, depositCents);
      const depositTransaction = await getTransaction(depositSettlement.transactionId);
      return Response.json({ requiresApproval: false, paymentMode: "reservation_deposit", product, fullPurchaseAuthorizationId: authorization.authorizationId, fullAmountAttempt: cardAuthorization, fullAmountDeclinedReason: cardAuthorization.declinedReason, depositCents, remainingCents: product.amountCents - depositCents, ap2AuthorizationId: depositAuthorization.authorizationId, card: depositCard, authorization: depositCardAuthorization, settlement: depositSettlement, transaction: depositTransaction });
    }
    let settlement = cardAuthorization;
    if (cardAuthorization.status !== "settled") {
      try { settlement = await settleAuthorization(cardAuthorization.transactionId, product.amountCents); }
      catch (error) {
        if (!(error instanceof RainApiError) || !error.detail?.includes("already closed")) throw error;
        settlement = { transactionId: cardAuthorization.transactionId, status: "settled" };
      }
    }
    const transaction = await getTransaction(settlement.transactionId);

    return Response.json({ requiresApproval: false, product, ap2AuthorizationId: authorization.authorizationId, collateral, card, authorization: cardAuthorization, settlement, transaction });
  } catch (error) {
    const detail = error instanceof RainApiError ? error.detail : undefined;
    return Response.json({ error: detail ?? (error instanceof Error ? error.message : "High-ticket purchase failed") }, { status: 500 });
  }
}
