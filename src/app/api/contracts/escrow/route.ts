import { createPublicClient, defineChain, http } from "viem";
import artifact from "@/contracts/raingentic-commerce-escrow.json";
import deployment from "@/contracts/deployment.json";

const chain = defineChain({ id: 10143, name: "Monad Testnet", nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 }, rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } } });

export async function GET() {
  try {
    const client = createPublicClient({ chain, transport: http() });
    const order = await client.readContract({ address: deployment.address as `0x${string}`, abi: artifact.abi, functionName: "orders", args: [deployment.sampleOrderId] }) as readonly [`0x${string}`, `0x${string}`, `0x${string}`, bigint, bigint, bigint, bigint, `0x${string}`, number];
    return Response.json({ ...deployment, order: { buyer: order[0], merchant: order[1], token: order[2], totalAmount: order[3].toString(), depositRequired: order[4].toString(), depositedAmount: order[5].toString(), expiresAt: order[6].toString(), termsHash: order[7], status: order[8] } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Escrow contract could not be read", ...deployment }, { status: 500 });
  }
}
