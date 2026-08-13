#!/usr/bin/env node
import { resolve } from "node:path";
import { connectSource } from "../src/caravel/connectors.mjs";
import { createReadinessReport, formatReadinessReport } from "../src/caravel/report.mjs";
import { readReport, writeWorkspace } from "../src/caravel/workspace.mjs";

function help() {
  console.log(`Caravel\n\nConnect an existing business to agentic commerce.\n\nUsage:\n  caravel connect <source> [--type openapi|shopify] [--dir path]\n  caravel report [--dir path]\n  caravel help\n\nExamples:\n  caravel connect https://example.com/openapi.json\n  caravel connect https://store.example.com --type shopify\n  caravel report`);
}

function option(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

async function main() {
  const [, , command = "help", ...args] = process.argv;
  const root = resolve(option(args, "--dir") ?? process.cwd());
  if (command === "help" || command === "--help" || command === "-h") return help();

  if (command === "connect") {
    const source = args.find((arg, index) => !arg.startsWith("-") && args[index - 1] !== "--type" && args[index - 1] !== "--dir");
    if (!source) throw new Error("Usage: caravel connect <source> [--type openapi|shopify]");
    console.log(`Connecting ${source}...`);
    const catalog = await connectSource(source, { type: option(args, "--type") });
    const report = createReadinessReport(catalog);
    const directory = await writeWorkspace(root, catalog, report);
    console.log("");
    console.log(formatReadinessReport(report));
    console.log(`\nWorkspace: ${directory}`);
    return;
  }

  if (command === "report") {
    console.log(formatReadinessReport(await readReport(root)));
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(`Caravel: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
