import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildApiProduct } from "./build.mjs";
import { normalizeOpenApi } from "./connectors.mjs";
import { installApiProduct } from "./install.mjs";
import { createReadinessReport } from "./report.mjs";
import { writeWorkspace } from "./workspace.mjs";

describe("Caravel installer", () => {
  it("installs discovery, gateway, access, and docs files", async () => {
    const root = await mkdtemp(join(tmpdir(), "caravel-install-source-"));
    const target = await mkdtemp(join(tmpdir(), "caravel-install-target-"));
    const source = resolve(root, "openapi.json");
    const openapi = { openapi: "3.1.0", info: { title: "Test API", version: "1" }, paths: { "/ping": { get: { summary: "Ping" } } } };
    await writeFile(source, JSON.stringify(openapi));
    const catalog = normalizeOpenApi(openapi, source);
    await writeWorkspace(root, catalog, createReadinessReport(catalog));
    await buildApiProduct(root, { upstreamBaseUrl: "https://api.example.com" });
    await installApiProduct(root, { target });
    expect(JSON.parse(await readFile(resolve(target, "public/.well-known/caravel.json"), "utf8")).upstreamBaseUrl).toBe("https://api.example.com");
    expect(await readFile(resolve(target, "src/app/api/caravel/[...path]/route.ts"), "utf8")).toContain("withCaravelAccess");
    expect(await readFile(resolve(target, "lib/caravel-access.ts"), "utf8")).toContain("CARAVEL_API_KEYS");
  });
});
