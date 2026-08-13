import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export function workspacePath(root = process.cwd()) {
  return resolve(root, ".caravel");
}

export async function writeWorkspace(root, catalog, report) {
  const directory = workspacePath(root);
  await mkdir(directory, { recursive: true });
  const config = {
    schema: "caravel/config/v1",
    source: catalog.source,
    publication: { status: "draft" },
    createdAt: new Date().toISOString(),
  };
  await Promise.all([
    writeFile(resolve(directory, "config.json"), `${JSON.stringify(config, null, 2)}\n`),
    writeFile(resolve(directory, "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`),
    writeFile(resolve(directory, "report.json"), `${JSON.stringify(report, null, 2)}\n`),
  ]);
  return directory;
}

export async function readReport(root = process.cwd()) {
  return JSON.parse(await readFile(resolve(workspacePath(root), "report.json"), "utf8"));
}
