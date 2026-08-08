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

  const handler = async () =>
    NextResponse.json({
      report: "delivery-quality-report.json",
      deliveredRecords: 100,
      measuredQualityRate: 0.94,
      verified: true,
    });

  protectedHandler = withX402(
    handler,
    {
      accepts: {
        scheme: "exact",
        price: `$${X402_VERIFICATION_PRICE}`,
        network,
        payTo: providerAddress,
      },
      description: "Delivery quality verification report",
      mimeType: "application/json",
    },
    server,
  );

  return protectedHandler;
}

export async function GET(request: NextRequest) {
  return getProtectedHandler()(request);
}
