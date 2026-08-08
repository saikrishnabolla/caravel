import { x402Client, wrapFetchWithPayment, decodePaymentResponseHeader } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import { isAddress, type Address, type Hex } from "viem";

export const MONAD_NETWORK = "eip155:10143";
export const MONAD_RPC_URL = "https://testnet-rpc.monad.xyz";
export const MONAD_USDC_ADDRESS = "0x534b2f3A21130d7a60830c2Df862319e593943A3";
export const MONAD_FACILITATOR_URL = "https://x402-facilitator.molandak.org";
export const MONAD_EXPLORER_URL = "https://monadvision.com";
export const X402_VERIFICATION_PRICE = "0.001";

export type MonadX402Receipt = {
  mode: "testnet";
  network: "Monad Testnet";
  asset: "USDC";
  amount: string;
  resource: string;
  transactionHash: string;
  explorerUrl: string;
  receiptId: string;
};

export function getMonadBuyerPrivateKey(
  env: Record<string, string | undefined> = process.env,
): Hex {
  const privateKey = env.MONAD_BUYER_PRIVATE_KEY;
  if (!privateKey || !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error("MONAD_BUYER_PRIVATE_KEY is missing or invalid");
  }
  return privateKey as Hex;
}

export function getMonadProviderAddress(
  env: Record<string, string | undefined> = process.env,
): Address {
  const address = env.MONAD_PROVIDER_ADDRESS;
  if (!address || !isAddress(address)) {
    throw new Error("MONAD_PROVIDER_ADDRESS is missing or invalid");
  }
  return address;
}

export async function purchaseDeliveryVerification(
  origin: string,
): Promise<MonadX402Receipt> {
  const account = privateKeyToAccount(getMonadBuyerPrivateKey());
  const providerAddress = getMonadProviderAddress();
  const client = new x402Client();
  registerExactEvmScheme(client, {
    signer: account,
    networks: [MONAD_NETWORK],
    schemeOptions: { rpcUrl: MONAD_RPC_URL },
  });
  client.registerPolicy((_version, requirements) =>
    requirements.filter(
      requirement =>
        requirement.scheme === "exact" &&
        requirement.network === MONAD_NETWORK &&
        requirement.asset.toLowerCase() === MONAD_USDC_ADDRESS.toLowerCase() &&
        requirement.amount === "1000" &&
        requirement.payTo.toLowerCase() === providerAddress.toLowerCase(),
    ),
  );

  const resource = new URL("/api/x402/verification", origin).toString();
  const paymentFetch = wrapFetchWithPayment(fetch, client);
  const response = await paymentFetch(resource, { cache: "no-store" });
  const responseBody = await response.text();

  if (!response.ok) {
    throw new Error(`Monad x402 payment failed (${response.status}): ${responseBody}`);
  }

  const paymentResponse =
    response.headers.get("PAYMENT-RESPONSE") ?? response.headers.get("X-PAYMENT-RESPONSE");
  if (!paymentResponse) {
    throw new Error("Monad x402 settlement response header was missing");
  }

  const settlement = decodePaymentResponseHeader(paymentResponse);
  if (!settlement.success || !settlement.transaction) {
    throw new Error(settlement.errorMessage ?? settlement.errorReason ?? "Monad settlement failed");
  }

  return {
    mode: "testnet",
    network: "Monad Testnet",
    asset: "USDC",
    amount: X402_VERIFICATION_PRICE,
    resource,
    transactionHash: settlement.transaction,
    explorerUrl: `${MONAD_EXPLORER_URL}/tx/${settlement.transaction}`,
    receiptId: settlement.transaction,
  };
}
