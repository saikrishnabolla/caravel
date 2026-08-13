import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { workspacePath } from "./workspace.mjs";

async function file(path) {
  try { await access(path, constants.R_OK); return true; } catch { return false; }
}

export async function inspectEnvironment(root = process.cwd()) {
  const workspace = workspacePath(root);
  const docker = spawnSync("docker", ["info"], { stdio: "ignore" }).status === 0;
  const podman = spawnSync("podman", ["info"], { stdio: "ignore" }).status === 0;
  const checks = [
    { name: "Node.js 22.19 or newer", pass: Number(process.versions.node.split(".")[0]) >= 22 },
    { name: ".caravel catalog", pass: await file(resolve(workspace, "catalog.json")) },
    { name: ".caravel configuration", pass: await file(resolve(workspace, "config.json")) },
    { name: "Docker or Podman", pass: docker || podman },
  ];
  return { checks, pass: checks.every(check => check.pass) };
}

export function formatDoctor(result) {
  return ["Caravel doctor", "", ...result.checks.map(check => `${check.pass ? "✓" : "✗"} ${check.name}`), "", result.pass ? "Ready" : "Needs attention"].join("\n");
}
