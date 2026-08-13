import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { configureProduct, MONAD_TESTNET_X402, upstreamAuthFromOptions } from "./configure.mjs";

describe("Caravel configuration", () => {
  it("saves Monad testnet and upstream auth without secrets", async () => {
    const root = await mkdtemp(join(tmpdir(), "caravel-config-"));
    await mkdir(resolve(root, ".caravel"));
    await writeFile(resolve(root, ".caravel/config.json"), JSON.stringify({ schema: "caravel/config/v1" }));
    await configureProduct(root, { x402Preset: "monad-testnet", x402PayTo: "0x1234", upstreamAuth: { type: "bearer", environmentVariable: "UPSTREAM_TOKEN" } });
    const config = JSON.parse(await readFile(resolve(root, ".caravel/config.json"), "utf8"));
    expect(config.product.x402).toMatchObject({ network: MONAD_TESTNET_X402.network, asset: MONAD_TESTNET_X402.asset });
    expect(config.product.upstreamAuth).toEqual({ type: "bearer", environmentVariable: "UPSTREAM_TOKEN" });
  });

  it("creates header auth references", () => {
    expect(upstreamAuthFromOptions({ upstreamHeader: "X-Service-Key", upstreamHeaderEnv: "SERVICE_KEY" })).toEqual({ type: "header", header: "X-Service-Key", environmentVariable: "SERVICE_KEY" });
  });
});
