import { describe, expect, it } from "vitest";
import {
  createOfficialAp2Authorization,
  verifyOfficialAp2Authorization,
} from "./ap2";

describe("official AP2 authorization bridge", () => {
  it("creates and re-verifies the mandate chain used by the app", async () => {
    const authorization = await createOfficialAp2Authorization({
      buyerId: "test-buyer",
      agentId: "test-agent",
      merchantId: "test-merchant",
      merchantName: "Test Merchant",
      sku: "test-service",
      title: "Test service",
      quantity: 1,
      amountCents: 1,
      maximumCents: 1,
      currency: "USD",
      paymentInstrument: "x402-usdc",
      paymentDescription: "Testnet USDC",
    });

    const verified = await verifyOfficialAp2Authorization(authorization.authorizationId);

    expect(verified).toMatchObject({
      protocol: "AP2",
      profile: "human-not-present",
      merchantId: "test-merchant",
      amountCents: 1,
      maximumCents: 1,
      paymentInstrument: "x402-usdc",
      checkoutMandate: {
        openVct: "mandate.checkout.open.1",
        closedVct: "mandate.checkout.1",
        merchantSignatureVerified: true,
      },
      paymentMandate: {
        openVct: "mandate.payment.open.1",
        closedVct: "mandate.payment.1",
        constraintsVerified: true,
      },
    });
  });
});
