#!/usr/bin/env node
import { resolve } from "node:path";
import { launchPi } from "../src/caravel/pi.mjs";
import { buildAndFormat, connectAndReport, loadAndFormatReport } from "../src/caravel/tools.mjs";

export function help() {
  console.log(`Caravel\n\nTurn an existing API into a product AI agents can discover, pay for, and use.\n\nUsage:\n  caravel\n  caravel connect <openapi-source> [--dir path]\n  caravel build [--api-key-header name] [--x402-pay-to address] [--x402-price amount] [--dir path]\n  caravel report [--dir path]\n  caravel help\n\nExamples:\n  caravel connect https://example.com/openapi.json\n  caravel build\n  caravel build --x402-pay-to 0x1234\n  caravel report`);
}

function option(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

async function main() {
  const [, , command, ...args] = process.argv;
  if (!command) return process.exitCode = await launchPi();
  const root = resolve(option(args, "--dir") ?? process.cwd());
  if (command === "help" || command === "--help" || command === "-h") return help();

  if (command === "connect") {
    const source = args.find((arg, index) => !arg.startsWith("-") && args[index - 1] !== "--type" && args[index - 1] !== "--dir");
    if (!source) throw new Error("Usage: caravel connect <openapi-source>");
    console.log(`Connecting ${source}...`);
    const result = await connectAndReport(source, { root, type: option(args, "--type") });
    console.log("");
    console.log(result.text);
    console.log(`\nWorkspace: ${result.directory}`);
    return;
  }

  if (command === "report") {
    console.log((await loadAndFormatReport(root)).text);
    return;
  }

  if (command === "build") {
    const result = await buildAndFormat(root, {
      apiKey: !args.includes("--no-api-key"),
      apiKeyHeader: option(args, "--api-key-header"),
      x402Price: option(args, "--x402-price"),
      x402PayTo: option(args, "--x402-pay-to"),
      x402Network: option(args, "--x402-network"),
    });
    console.log(result.text);
    return;
  }

  process.exitCode = await launchPi([command, ...args]);
}

main().catch((error) => {
  console.error(`Caravel: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
