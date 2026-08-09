import { A2A_PROTOCOL_VERSION } from "@a2a-js/sdk";
import { getMonadBuyerPrivateKey, getMonadProviderAddress, MONAD_NETWORK } from "@/lib/monad";
import { getRainConfig } from "@/lib/rain";

function configured(check: () => unknown) {
  try {
    check();
    return true;
  } catch {
    return false;
  }
}

export function GET() {
  const rainConfigured = configured(getRainConfig);
  const monadBuyerConfigured = configured(getMonadBuyerPrivateKey);
  const monadSellerConfigured = configured(getMonadProviderAddress);

  return Response.json({
    rain: {
      configured: rainConfigured,
      environment: process.env.RAIN_API_BASE_URL?.includes("api-dev") === false ? "production" : "sandbox",
    },
    monad: {
      buyerConfigured: monadBuyerConfigured,
      sellerConfigured: monadSellerConfigured,
      network: MONAD_NETWORK,
    },
    a2a: {
      configured: true,
      protocolVersion: A2A_PROTOCOL_VERSION,
    },
    openai: {
      configured: Boolean(process.env.OPENAI_API_KEY ?? process.env.openai_key),
    },
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
