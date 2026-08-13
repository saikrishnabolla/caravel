import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { workspacePath } from "./workspace.mjs";

function operationId(product) {
  return product.id;
}

function defaultGuide(product) {
  const method = product.method.toUpperCase();
  return {
    operationId: operationId(product),
    title: product.name,
    overview: product.description || `${method} ${product.path} performs this API operation. Review the request and response schema before using it in production.`,
    useCases: [
      `Use this operation when an application needs ${product.name.toLowerCase()}.`,
      "Combine it with related endpoints when the workflow needs more context than one response provides.",
    ],
    workflow: [
      "Collect the required request values.",
      `Send a ${method} request to ${product.path}.`,
      "Check the response status before using the returned data.",
    ],
    notes: product.description ? [] : ["The source specification does not include a detailed description. This draft should be reviewed."],
    provenance: "source-derived",
  };
}

function defaultSnippet(product) {
  return {
    id: `${operationId(product)}-react`,
    operationId: operationId(product),
    name: `${product.name} request form`,
    description: `A small React example for calling ${product.name}.`,
    framework: "react",
    prompt: `Build a compact form that calls ${product.method} ${product.path}, shows loading and error states, and renders the JSON response.`,
    code: null,
    provenance: "source-derived",
  };
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

export async function ensureEditorialWorkspace(root = process.cwd(), catalog) {
  const workspace = workspacePath(root);
  const editorialPath = resolve(workspace, "editorial.json");
  const snippetsPath = resolve(workspace, "snippets.json");
  const existingEditorial = await readJson(editorialPath, null);
  const existingSnippets = await readJson(snippetsPath, null);
  const validIds = new Set(catalog.products.map(operationId));
  const editorial = {
    schema: "caravel/editorial/v1",
    guides: catalog.products.map((product) => existingEditorial?.guides?.find((guide) => guide.operationId === operationId(product)) ?? defaultGuide(product)),
  };
  const snippets = {
    schema: "caravel/snippets/v1",
    snippets: [
      ...(existingSnippets?.snippets ?? []).filter((snippet) => validIds.has(snippet.operationId)),
      ...catalog.products.filter((product) => !(existingSnippets?.snippets ?? []).some((snippet) => snippet.operationId === operationId(product))).map(defaultSnippet),
    ],
  };
  await Promise.all([
    writeFile(editorialPath, `${JSON.stringify(editorial, null, 2)}\n`),
    writeFile(snippetsPath, `${JSON.stringify(snippets, null, 2)}\n`),
  ]);
  return { editorial, snippets, editorialPath, snippetsPath };
}

export async function saveEditorialGuide(root = process.cwd(), guide) {
  const workspace = workspacePath(root);
  const catalog = await readJson(resolve(workspace, "catalog.json"), { products: [] });
  if (!catalog.products.some((product) => product.id === guide.operationId)) throw new Error(`Unknown operationId: ${guide.operationId}`);
  const current = await readJson(resolve(workspace, "editorial.json"), { schema: "caravel/editorial/v1", guides: [] });
  const next = {
    schema: "caravel/editorial/v1",
    guides: [...current.guides.filter((item) => item.operationId !== guide.operationId), { ...guide, provenance: "ai-assisted" }],
  };
  await writeFile(resolve(workspace, "editorial.json"), `${JSON.stringify(next, null, 2)}\n`);
  return next.guides.find((item) => item.operationId === guide.operationId);
}

export async function saveSnippet(root = process.cwd(), snippet) {
  const workspace = workspacePath(root);
  const catalog = await readJson(resolve(workspace, "catalog.json"), { products: [] });
  if (!catalog.products.some((product) => product.id === snippet.operationId)) throw new Error(`Unknown operationId: ${snippet.operationId}`);
  const current = await readJson(resolve(workspace, "snippets.json"), { schema: "caravel/snippets/v1", snippets: [] });
  const next = {
    schema: "caravel/snippets/v1",
    snippets: [...current.snippets.filter((item) => item.id !== snippet.id), { ...snippet, provenance: "ai-assisted" }],
  };
  await writeFile(resolve(workspace, "snippets.json"), `${JSON.stringify(next, null, 2)}\n`);
  return next.snippets.find((item) => item.id === snippet.id);
}
