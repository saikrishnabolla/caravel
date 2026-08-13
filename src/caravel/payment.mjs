import { decodePaymentResponseHeader, wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

export async function verifyPaidEndpoint(url, options = {}) {
  const privateKey = options.privateKey ?? process.env[options.privateKeyEnvironmentVariable ?? "CARAVEL_BUYER_PRIVATE_KEY"];
  if (!privateKey || !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) throw new Error("A valid test buyer private key is required.");
  const client = new x402Client();
  registerExactEvmScheme(client, {
    signer: privateKeyToAccount(privateKey),
    networks: options.network ? [options.network] : undefined,
    schemeOptions: options.rpcUrl ? { rpcUrl: options.rpcUrl } : undefined,
  });
  if (options.maximumAtomicAmount || options.payTo || options.asset) {
    client.registerPolicy((_version, requirements) => requirements.filter(requirement => {
      if (options.network && requirement.network !== options.network) return false;
      if (options.payTo && requirement.payTo.toLowerCase() !== options.payTo.toLowerCase()) return false;
      if (options.asset && requirement.asset.toLowerCase() !== options.asset.toLowerCase()) return false;
      if (options.maximumAtomicAmount && BigInt(requirement.amount) > BigInt(options.maximumAtomicAmount)) return false;
      return true;
    }));
  }
  const response = await wrapFetchWithPayment(fetch, client)(url, { cache: "no-store" });
  const body = await response.text();
  if (!response.ok) throw new Error(`Paid request failed (${response.status}): ${body}`);
  const header = response.headers.get("PAYMENT-RESPONSE") ?? response.headers.get("X-PAYMENT-RESPONSE");
  if (!header) throw new Error("Settlement response header was missing.");
  const settlement = decodePaymentResponseHeader(header);
  if (!settlement.success || !settlement.transaction) throw new Error(settlement.errorMessage ?? settlement.errorReason ?? "Settlement failed.");
  return { status: response.status, body, transaction: settlement.transaction, network: settlement.network, payer: settlement.payer };
}
