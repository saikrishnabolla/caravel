import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import type { Network } from "@x402/core/types";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { withX402 } from "@x402/next";
import { NextRequest, NextResponse } from "next/server";
import {
  getMonadProviderAddress,
  MONAD_FACILITATOR_URL,
  MONAD_NETWORK,
  MONAD_USDC_ADDRESS,
  X402_VERIFICATION_PRICE,
} from "@/lib/monad";
import { verifyOfficialAp2Authorization } from "@/lib/ap2";

const network = MONAD_NETWORK as Network;
type ProtectedHandler = (request: NextRequest) => Promise<NextResponse>;
let protectedHandler: ProtectedHandler | undefined;

function getProtectedHandler(): ProtectedHandler {
  if (protectedHandler) return protectedHandler;
  const providerAddress = getMonadProviderAddress();
  const facilitatorClient = new HTTPFacilitatorClient({ url: MONAD_FACILITATOR_URL });
  const server = new x402ResourceServer(facilitatorClient);
  const scheme = new ExactEvmScheme();
  scheme.registerMoneyParser(async (amount, requestedNetwork) => {
    if (requestedNetwork !== network) return null;
    return {
      amount: Math.floor(amount * 1_000_000).toString(),
      asset: MONAD_USDC_ADDRESS,
      extra: { name: "USDC", version: "2" },
    };
  });
  server.register(network, scheme);

  const handler: ProtectedHandler = async (request: NextRequest) => {
    const authorizationId = request.headers.get("X-AP2-Authorization-ID");
    if (!authorizationId) {
      return NextResponse.json({ error: "Official AP2 authorization is required" }, { status: 401 });
    }
    const ap2 = await verifyOfficialAp2Authorization(authorizationId);
    if (
      ap2.merchantId !== "missionclear-agent" ||
      ap2.paymentInstrument !== "x402-usdc" ||
      ap2.amountCents !== 1 ||
      ap2.maximumCents !== 1
    ) {
      return NextResponse.json({ error: "AP2 mandate does not authorize this resource" }, { status: 403 });
    }
    return NextResponse.json({
      packet: "agricultural-mission-readiness.json",
      missionsPrepared: 100,
      airspaceChecks: 100,
      weatherChecks: 100,
      complianceChecks: 96,
      measuredReadinessRate: 0.96,
      ap2AuthorizationId: ap2.authorizationId,
      ap2CheckoutReference: ap2.checkoutMandate.reference,
      ap2PaymentReference: ap2.paymentMandate.reference,
      disclaimer: "This packet supports operational readiness and does not guarantee FAA authorization.",
    });
  };

  protectedHandler = withX402(handler, {
    accepts: {
      scheme: "exact",
      price: `$${X402_VERIFICATION_PRICE}`,
      network,
      payTo: providerAddress,
    },
    description: "Agricultural drone mission-readiness packet",
    mimeType: "application/json",
  }, server);
  return protectedHandler;
}

export async function GET(request: NextRequest) {
  return getProtectedHandler()(request);
}
