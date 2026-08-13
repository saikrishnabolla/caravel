import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { runSetup } from "./setup.mjs";

describe("Caravel setup", () => {
  it("connects, configures, and builds without interactive input", async () => {
    const root = await mkdtemp(join(tmpdir(), "caravel-setup-"));
    const source = resolve(root, "openapi.json");
    await writeFile(source, JSON.stringify({ openapi: "3.1.0", info: { title: "Setup API", version: "1" }, paths: { "/ping": { get: { summary: "Ping" } } } }));
    const result = await runSetup(root, { source, upstreamBaseUrl: "https://api.example.com", apiKeyHeader: "X-Key", enableX402: false, prompts: {} });
    expect(result.manifest.upstreamBaseUrl).toBe("https://api.example.com");
  });
});
