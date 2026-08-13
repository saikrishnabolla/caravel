import { access, copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";
import { workspacePath } from "./workspace.mjs";
import { ensureTargetDependencies } from "./package.mjs";

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
  const product = JSON.parse(await readFile(resolve(generated, ".well-known", "caravel.json"), "utf8"));
  await ensureTargetDependencies(target, { x402: product.access.some(method => method.type === "x402"), install: options.installDependencies });
  const files = await Promise.all([
    copy(resolve(generated, ".well-known", "caravel.json"), resolve(target, "public", ".well-known", "caravel.json"), options.force),
    copy(resolve(generated, ".well-known", "agent-card.json"), resolve(target, "public", ".well-known", "agent-card.json"), options.force),
    copy(resolve(generated, "access", "next.ts"), resolve(target, "lib", "caravel-access.ts"), options.force),
    copy(resolve(generated, "access", "gateway-route.ts"), resolve(target, "src", "app", "api", "caravel", "[...path]", "route.ts"), options.force),
    copy(resolve(generated, "docs", "index.mdx"), resolve(target, options.docsDir ?? "content/docs/caravel", "index.mdx"), options.force),
    copy(resolve(generated, "docs", "endpoints.mdx"), resolve(target, options.docsDir ?? "content/docs/caravel", "endpoints.mdx"), options.force),
    copy(resolve(generated, "docs", "meta.json"), resolve(target, options.docsDir ?? "content/docs/caravel", "meta.json"), options.force),
    copy(resolve(generated, "docs-app", "api-docs.ts"), resolve(target, "src/app/caravel-docs/api-docs.ts"), options.force),
    copy(resolve(generated, "docs-app", "openapi-reference.tsx"), resolve(target, "src/app/caravel-docs/openapi-reference.tsx"), options.force),
    copy(resolve(generated, "docs-app", "loading.tsx"), resolve(target, "src/app/caravel-docs/loading.tsx"), options.force),
    copy(resolve(generated, "docs-app", "caravel-docs.css"), resolve(target, "src/app/caravel-docs/caravel-docs.css"), options.force),
    copy(resolve(generated, "docs-app", "layout.tsx"), resolve(target, "src/app/caravel-docs/layout.tsx"), options.force),
    copy(resolve(generated, "docs-app", "page.tsx"), resolve(target, "src/app/caravel-docs/page.tsx"), options.force),
    copy(resolve(generated, "docs-app", "quickstart", "page.tsx"), resolve(target, "src/app/caravel-docs/quickstart/page.tsx"), options.force),
    copy(resolve(generated, "docs-app", "authentication", "page.tsx"), resolve(target, "src/app/caravel-docs/authentication/page.tsx"), options.force),
    copy(resolve(generated, "docs-app", "sdks", "page.tsx"), resolve(target, "src/app/caravel-docs/sdks/page.tsx"), options.force),
    copy(resolve(generated, "docs-app", "guides", "[operation]", "page.tsx"), resolve(target, "src/app/caravel-docs/guides/[operation]/page.tsx"), options.force),
    copy(resolve(generated, "docs-app", "reference", "page.tsx"), resolve(target, "src/app/caravel-docs/reference/page.tsx"), options.force),
    copy(resolve(generated, "docs-app", "reference", "[operation]", "page.tsx"), resolve(target, "src/app/caravel-docs/reference/[operation]/page.tsx"), options.force),
    copy(resolve(generated, "docs-app", "snippets", "page.tsx"), resolve(target, "src/app/caravel-docs/snippets/page.tsx"), options.force),
    copy(resolve(generated, "docs-app", "openapi", "page.tsx"), resolve(target, "src/app/caravel-docs/openapi/page.tsx"), options.force),
    copy(resolve(generated, "docs-app", "openapi.json"), resolve(target, "public/caravel-openapi.json"), options.force),
  ]);
  const manifestPath = resolve(target, ".caravel-installed.json");
  await writeFile(manifestPath, `${JSON.stringify({ schema: "caravel/install/v1", files, installedAt: new Date().toISOString() }, null, 2)}\n`);
  files.push(manifestPath);
  return { target, files };
}

export async function uninstallApiProduct(targetRoot = process.cwd()) {
  const target = resolve(targetRoot);
  const manifestPath = resolve(target, ".caravel-installed.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  for (const path of manifest.files ?? []) await rm(path, { force: true });
  await rm(manifestPath, { force: true });
  return { target, files: manifest.files ?? [] };
}

export function formatInstallResult(result) {
  return ["Caravel installation", "", ...result.files.map((file) => `✓ ${file}`), "", "Set CARAVEL_API_KEYS. For x402, also set X402_FACILITATOR_URL."].join("\n");
}
