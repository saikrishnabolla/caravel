import { readFile, writeFile } from "node:fs/promises";
import { createPublicClient, createWalletClient, defineChain, http, keccak256, stringToHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const artifact = JSON.parse(await readFile(new URL("../src/contracts/raingentic-commerce-escrow.json", import.meta.url), "utf8"));
const key = process.env.MONAD_BUYER_PRIVATE_KEY;
const merchant = process.env.MONAD_PROVIDER_ADDRESS;
if (!key || !merchant) throw new Error("MONAD_BUYER_PRIVATE_KEY and MONAD_PROVIDER_ADDRESS are required");
const chain = defineChain({ id: 10143, name: "Monad Testnet", nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 }, rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } }, blockExplorers: { default: { name: "MonadVision", url: "https://monadvision.com" } } });
const account = privateKeyToAccount(key);
const publicClient = createPublicClient({ chain, transport: http() });
const walletClient = createWalletClient({ account, chain, transport: http() });
const balance = await publicClient.getBalance({ address: account.address });
if (balance === 0n) throw new Error(`Buyer wallet ${account.address} needs MON for contract deployment gas`);
const deploymentHash = await walletClient.deployContract({ abi: artifact.abi, bytecode: artifact.bytecode });
const deploymentReceipt = await publicClient.waitForTransactionReceipt({ hash: deploymentHash });
if (!deploymentReceipt.contractAddress) throw new Error("Contract address missing from deployment receipt");

const orderId = keccak256(stringToHex("raptor-xag-p150-max-starter-28900"));
const termsHash = keccak256(stringToHex(JSON.stringify({ product: "XAG P150 MAX Starter Kit (7Kw 2B2C)", totalUsd: 28900, depositUsd: 500, source: "Raptor Dynamic Shopify catalog", payment: "Rain card or USDC escrow", approval: "Human approval required" })));
const createOrderHash = await walletClient.writeContract({ address: deploymentReceipt.contractAddress, abi: artifact.abi, functionName: "createOrder", args: [orderId, merchant, "0x534b2f3A21130d7a60830c2Df862319e593943A3", 28_900_000_000n, 500_000_000n, BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60), termsHash] });
await publicClient.waitForTransactionReceipt({ hash: createOrderHash });
const deployment = { network: "Monad Testnet", chainId: 10143, address: deploymentReceipt.contractAddress, deploymentTransaction: deploymentHash, sampleOrderTransaction: createOrderHash, sampleOrderId: orderId, termsHash, buyer: account.address, merchant, totalAmountUSDC: "28900", depositRequiredUSDC: "500", explorerUrl: `https://monadvision.com/address/${deploymentReceipt.contractAddress}` };
await writeFile(new URL("../src/contracts/deployment.json", import.meta.url), `${JSON.stringify(deployment, null, 2)}\n`);
console.log(JSON.stringify(deployment, null, 2));
