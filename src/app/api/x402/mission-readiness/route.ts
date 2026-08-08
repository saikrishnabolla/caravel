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

  const handler = async () => NextResponse.json({
    packet: "agricultural-mission-readiness.json",
    missionsPrepared: 100,
    airspaceChecks: 100,
    weatherChecks: 100,
    complianceChecks: 96,
    measuredReadinessRate: 0.96,
    disclaimer: "This packet supports operational readiness and does not guarantee FAA authorization.",
  });

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
