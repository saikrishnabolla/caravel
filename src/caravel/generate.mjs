import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { workspacePath } from "./workspace.mjs";

export function fernGenerateArguments(options = {}) {
  return ["generate", "--group", "local", "--local", "--runner", options.runner ?? "docker", "--no-prompt"];
}

export function generateSdks(root = process.cwd(), options = {}) {
  const cwd = resolve(workspacePath(root), "generated", "fern");
  const fern = options.fernPath ?? resolve(import.meta.dirname, "../../node_modules/.bin/fern");
  const child = spawn(fern, fernGenerateArguments(options), {
    cwd,
    env: { ...process.env, FERN_NO_VERSION_REDIRECTION: "true" },
    stdio: options.stdio ?? "inherit",
  });
  return new Promise((resolvePromise, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) return reject(new Error(`Fern stopped with signal ${signal}.`));
      if (code !== 0) return reject(new Error(`Fern generation failed with exit code ${code}.`));
      resolvePromise(resolve(workspacePath(root), "generated", "sdk"));
    });
  });
}
