import { access, copyFile, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";
import { workspacePath } from "./workspace.mjs";

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function copy(source, target, force) {
  if (!force && await exists(target)) throw new Error(`${target} already exists. Use --force to replace Caravel-installed files.`);
  await mkdir(resolve(target, ".."), { recursive: true });
  await copyFile(source, target);
  return target;
}

export async function installApiProduct(root = process.cwd(), options = {}) {
  const target = resolve(options.target ?? root);
  const generated = resolve(workspacePath(root), "generated");
  const files = await Promise.all([
    copy(resolve(generated, ".well-known", "caravel.json"), resolve(target, "public", ".well-known", "caravel.json"), options.force),
    copy(resolve(generated, "access", "next.ts"), resolve(target, "lib", "caravel-access.ts"), options.force),
    copy(resolve(generated, "access", "gateway-route.ts"), resolve(target, "src", "app", "api", "caravel", "[...path]", "route.ts"), options.force),
    copy(resolve(generated, "docs", "index.mdx"), resolve(target, options.docsDir ?? "content/docs/caravel", "index.mdx"), options.force),
    copy(resolve(generated, "docs", "endpoints.mdx"), resolve(target, options.docsDir ?? "content/docs/caravel", "endpoints.mdx"), options.force),
    copy(resolve(generated, "docs", "meta.json"), resolve(target, options.docsDir ?? "content/docs/caravel", "meta.json"), options.force),
  ]);
  return { target, files };
}

export function formatInstallResult(result) {
  return ["Caravel installation", "", ...result.files.map((file) => `✓ ${file}`), "", "Set CARAVEL_API_KEYS. For x402, also set X402_FACILITATOR_URL."].join("\n");
}
