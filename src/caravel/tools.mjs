import { resolve } from "node:path";
import { connectSource } from "./connectors.mjs";
import { createReadinessReport, formatReadinessReport } from "./report.mjs";
import { readReport, writeWorkspace } from "./workspace.mjs";
import { buildApiProduct, formatBuildResult } from "./build.mjs";
import { generateSdks } from "./generate.mjs";
import { formatInstallResult, installApiProduct } from "./install.mjs";
import { uninstallApiProduct } from "./install.mjs";
import { configureProduct } from "./configure.mjs";
import { formatDoctor, inspectEnvironment } from "./doctor.mjs";
import { runSetup } from "./setup.mjs";

export async function connectAndReport(source, options = {}) {
  const root = resolve(options.root ?? process.cwd());
  const catalog = await connectSource(source, { type: options.type });
  const report = createReadinessReport(catalog);
  const directory = await writeWorkspace(root, catalog, report);
  return { catalog, report, directory, text: formatReadinessReport(report) };
}

export async function loadAndFormatReport(root = process.cwd()) {
  const report = await readReport(resolve(root));
  return { report, text: formatReadinessReport(report) };
}

export async function buildAndFormat(root = process.cwd(), options = {}) {
  const result = await buildApiProduct(resolve(root), options);
  return { ...result, text: formatBuildResult(result) };
}

export async function generateAndFormat(root = process.cwd(), options = {}) {
  const directory = await generateSdks(resolve(root), options);
  return { directory, text: `Caravel SDK generation complete\n\nOutput: ${directory}` };
}

export async function installAndFormat(root = process.cwd(), options = {}) {
  const result = await installApiProduct(resolve(root), options);
  return { ...result, text: formatInstallResult(result) };
}

export async function configureAndFormat(root = process.cwd(), options = {}) {
  const config = await configureProduct(resolve(root), options);
  return { config, text: `Caravel configuration saved\n\n${resolve(root, ".caravel/config.json")}` };
}

export async function uninstallAndFormat(target = process.cwd()) {
  const result = await uninstallApiProduct(resolve(target));
  return { ...result, text: ["Caravel uninstall", "", ...result.files.map(file => `✓ Removed ${file}`)].join("\n") };
}

export async function doctorAndFormat(root = process.cwd()) {
  const result = await inspectEnvironment(resolve(root));
  return { ...result, text: formatDoctor(result) };
}

export async function setupAndFormat(root = process.cwd(), options = {}) {
  const result = await runSetup(resolve(root), options);
  return { ...result, text: `Caravel setup complete\n\n${result.output}` };
}
