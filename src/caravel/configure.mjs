import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { workspacePath } from "./workspace.mjs";

export const MONAD_TESTNET_X402 = {
  network: "eip155:10143",
  facilitatorUrl: "https://x402-facilitator.molandak.org",
  asset: "0x534b2f3A21130d7a60830c2Df862319e593943A3",
  assetName: "USDC",
  assetVersion: "2",
  decimals: 6,
  rpcUrl: "https://testnet-rpc.monad.xyz",
};

export async function configureProduct(root = process.cwd(), options = {}) {
  const path = resolve(workspacePath(root), "config.json");
  const config = JSON.parse(await readFile(path, "utf8"));
  const preset = options.x402Preset === "monad-testnet" ? MONAD_TESTNET_X402 : undefined;
  config.product = {
    upstreamBaseUrl: options.upstreamBaseUrl ?? config.product?.upstreamBaseUrl,
    upstreamAuth: options.upstreamAuth ?? config.product?.upstreamAuth ?? { type: "none" },
    apiKey: options.apiKey === false ? false : {
      header: options.apiKeyHeader ?? config.product?.apiKey?.header ?? "X-API-Key",
    },
    x402: options.x402PayTo ? {
      payTo: options.x402PayTo,
      price: options.x402Price,
      ...preset,
      network: options.x402Network ?? preset?.network,
      facilitatorUrl: options.x402FacilitatorUrl ?? preset?.facilitatorUrl,
      asset: options.x402Asset ?? preset?.asset,
      assetName: options.x402AssetName ?? preset?.assetName,
      assetVersion: options.x402AssetVersion ?? preset?.assetVersion,
      decimals: options.x402Decimals ? Number(options.x402Decimals) : preset?.decimals,
      rpcUrl: options.x402RpcUrl ?? preset?.rpcUrl,
    } : config.product?.x402,
  };
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`);
  return config;
}

export function upstreamAuthFromOptions(options = {}) {
  if (options.upstreamBearerEnv) return { type: "bearer", environmentVariable: options.upstreamBearerEnv };
  if (options.upstreamHeader && options.upstreamHeaderEnv) return { type: "header", header: options.upstreamHeader, environmentVariable: options.upstreamHeaderEnv };
  return undefined;
}
