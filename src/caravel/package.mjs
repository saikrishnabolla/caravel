import { access, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

function run(command, args, options = {}) {
  const child = spawn(command, args, { cwd: options.cwd, stdio: options.stdio ?? "inherit", env: process.env });
  return new Promise((resolvePromise, reject) => {
    child.once("error", reject);
    child.once("exit", code => code === 0 ? resolvePromise() : reject(new Error(`${command} exited with code ${code}.`)));
  });
}

export async function ensureTargetDependencies(target, options = {}) {
  const root = resolve(target);
  const packagePath = resolve(root, "package.json");
  const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
  const required = ["fumadocs-core", "fumadocs-ui", "fumadocs-openapi", "@scalar/api-client-react", "json-schema-typed", ...(options.x402 ? ["@x402/core", "@x402/evm", "@x402/extensions", "@x402/next"] : [])];
  const missing = required.filter(name => !packageJson.dependencies?.[name] && !packageJson.devDependencies?.[name]);
  if (missing.length && options.install !== false) await run(options.packageManager ?? await detectPackageManager(root), ["add", ...missing], { cwd: root });
  return missing;
}

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

export async function detectPackageManager(root) {
  if (await exists(resolve(root, "pnpm-lock.yaml"))) return "pnpm";
  if (await exists(resolve(root, "yarn.lock"))) return "yarn";
  if (await exists(resolve(root, "bun.lock")) || await exists(resolve(root, "bun.lockb"))) return "bun";
  return "npm";
}

export async function addPackageScripts(root = process.cwd()) {
  const path = resolve(root, "package.json");
  const pkg = JSON.parse(await readFile(path, "utf8"));
  pkg.scripts = { ...pkg.scripts, caravel: "caravel", "caravel:doctor": "caravel doctor" };
  await writeFile(path, `${JSON.stringify(pkg, null, 2)}\n`);
  return path;
}
