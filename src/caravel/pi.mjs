import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export function piArguments(args = [], root = repositoryRoot) {
  return [
    resolve(root, "node_modules/@earendil-works/pi-coding-agent/dist/cli.js"),
    "--append-system-prompt",
    resolve(root, "runtime/SYSTEM.md"),
    "--extension",
    resolve(root, "extensions/caravel.ts"),
    "--skill",
    resolve(root, "skills/caravel-agentic-commerce"),
    ...args,
  ];
}

export function launchPi(args = [], options = {}) {
  const child = spawn(process.execPath, piArguments(args, options.repositoryRoot), {
    cwd: options.cwd ?? process.cwd(),
    env: process.env,
    stdio: "inherit",
  });

  return new Promise((resolvePromise, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) return reject(new Error(`Pi stopped with signal ${signal}.`));
      resolvePromise(code ?? 1);
    });
  });
}
