#!/usr/bin/env node
import { resolve } from "node:path";
import { launchPi } from "../src/caravel/pi.mjs";
import { buildAndFormat, configureAndFormat, connectAndReport, doctorAndFormat, generateAndFormat, installAndFormat, loadAndFormatReport, setupAndFormat, uninstallAndFormat } from "../src/caravel/tools.mjs";
import { upstreamAuthFromOptions } from "../src/caravel/configure.mjs";

export function help() {
  console.log(`Caravel\n\nTurn an existing API into a product AI agents can discover, pay for, and use.\n\nUsage:\n  caravel setup\n  caravel connect <openapi-source>\n  caravel configure [options]\n  caravel build\n  caravel generate\n  caravel install [--target path]\n  caravel update [--target path]\n  caravel uninstall [--target path]\n  caravel doctor\n  caravel report`);
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

  if (command === "setup") {
    console.log((await setupAndFormat(root)).text);
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
      upstreamBaseUrl: option(args, "--upstream"),
      upstreamAuth: upstreamAuthFromOptions({ upstreamBearerEnv: option(args, "--upstream-bearer-env"), upstreamHeader: option(args, "--upstream-header"), upstreamHeaderEnv: option(args, "--upstream-header-env") }),
    });
    console.log(result.text);
    return;
  }

  if (command === "configure") {
    const payToEnvironmentVariable = option(args, "--x402-pay-to-env");
    console.log((await configureAndFormat(root, {
      upstreamBaseUrl: option(args, "--upstream"),
      upstreamAuth: upstreamAuthFromOptions({ upstreamBearerEnv: option(args, "--upstream-bearer-env"), upstreamHeader: option(args, "--upstream-header"), upstreamHeaderEnv: option(args, "--upstream-header-env") }),
      apiKey: !args.includes("--no-api-key"),
      apiKeyHeader: option(args, "--api-key-header"),
      x402Preset: option(args, "--x402-preset"),
      x402PayTo: option(args, "--x402-pay-to") ?? (payToEnvironmentVariable ? process.env[payToEnvironmentVariable] : undefined),
      x402Price: option(args, "--x402-price"),
      x402Network: option(args, "--x402-network"),
      x402FacilitatorUrl: option(args, "--x402-facilitator"),
      x402Asset: option(args, "--x402-asset"),
    })).text);
    return;
  }

  if (command === "generate") {
    console.log((await generateAndFormat(root, { runner: option(args, "--runner") })).text);
    return;
  }

  if (command === "install" || command === "update") {
    console.log((await installAndFormat(root, { target: option(args, "--target"), docsDir: option(args, "--docs-dir"), force: command === "update" || args.includes("--force") })).text);
    return;
  }

  if (command === "uninstall") {
    console.log((await uninstallAndFormat(option(args, "--target") ?? root)).text);
    return;
  }

  if (command === "doctor") {
    console.log((await doctorAndFormat(root)).text);
    return;
  }

  process.exitCode = await launchPi([command, ...args]);
}

main().catch((error) => {
  console.error(`Caravel: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
