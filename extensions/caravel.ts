import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { buildAndFormat, configureAndFormat, connectAndReport, doctorAndFormat, generateAndFormat, installAndFormat, loadAndFormatReport, saveGuideAndFormat, saveSnippetAndFormat, uninstallAndFormat } from "../src/caravel/tools.mjs";

export default function caravelExtension(pi: ExtensionAPI) {
  pi.registerTool({
    name: "caravel_connect",
    label: "Connect API",
    description: "Import an OpenAPI document into the local .caravel workspace and return a source-backed readiness report.",
    parameters: Type.Object({
      source: Type.String({ description: "OpenAPI URL or local JSON file" }),
      type: Type.Optional(Type.Union([Type.Literal("openapi"), Type.Literal("auto")])),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const result = await connectAndReport(params.source, { root: ctx.cwd, type: params.type });
      return {
        content: [{ type: "text", text: `${result.text}\n\nWorkspace: ${result.directory}` }],
        details: { report: result.report, catalog: result.catalog },
      };
    },
  });

  pi.registerTool({
    name: "caravel_write_guide",
    label: "Write API guide",
    description: "Save an editable, source-grounded usage guide for one imported OpenAPI operation. Explain use cases and workflow, but do not invent API behavior.",
    parameters: Type.Object({
      operationId: Type.String(),
      title: Type.String(),
      overview: Type.String(),
      useCases: Type.Array(Type.String()),
      workflow: Type.Array(Type.String()),
      notes: Type.Array(Type.String()),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const result = await saveGuideAndFormat(ctx.cwd, params);
      return { content: [{ type: "text", text: result.text }], details: { guide: result.guide } };
    },
  });

  pi.registerTool({
    name: "caravel_write_snippet",
    label: "Write UI snippet",
    description: "Save an editable UI snippet definition grounded in an imported API operation.",
    parameters: Type.Object({
      id: Type.String(),
      operationId: Type.String(),
      name: Type.String(),
      description: Type.String(),
      framework: Type.Union([Type.Literal("react"), Type.Literal("html"), Type.Literal("nextjs")]),
      prompt: Type.String(),
      code: Type.Optional(Type.String()),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const result = await saveSnippetAndFormat(ctx.cwd, params);
      return { content: [{ type: "text", text: result.text }], details: { snippet: result.snippet } };
    },
  });

  pi.registerTool({
    name: "caravel_report",
    label: "Read readiness report",
    description: "Read and summarize the current .caravel readiness report without changing it.",
    parameters: Type.Object({}),
    async execute(_toolCallId, _params, _signal, _onUpdate, ctx) {
      const result = await loadAndFormatReport(ctx.cwd);
      return {
        content: [{ type: "text", text: result.text }],
        details: { report: result.report },
      };
    },
  });

  pi.registerTool({
    name: "caravel_build",
    label: "Build API product",
    description: "Generate agent discovery, Fern, Fumadocs content, and an API-key or x402 Next.js access wrapper from the connected API.",
    parameters: Type.Object({
      apiKeyHeader: Type.Optional(Type.String()),
      x402Price: Type.Optional(Type.String()),
      x402PayTo: Type.Optional(Type.String()),
      x402Network: Type.Optional(Type.String()),
      upstreamBaseUrl: Type.Optional(Type.String()),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const result = await buildAndFormat(ctx.cwd, params);
      return { content: [{ type: "text", text: result.text }], details: { manifest: result.manifest } };
    },
  });

  pi.registerTool({
    name: "caravel_generate",
    label: "Generate SDKs",
    description: "Generate TypeScript and Python SDKs locally with Fern using Docker or Podman.",
    parameters: Type.Object({ runner: Type.Optional(Type.Union([Type.Literal("docker"), Type.Literal("podman")])) }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const result = await generateAndFormat(ctx.cwd, params);
      return { content: [{ type: "text", text: result.text }], details: { directory: result.directory } };
    },
  });

  pi.registerTool({
    name: "caravel_install",
    label: "Install API product",
    description: "Install the generated discovery file, Next.js gateway, access wrapper, and Fumadocs content into a target project.",
    parameters: Type.Object({ target: Type.Optional(Type.String()), force: Type.Optional(Type.Boolean()) }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const result = await installAndFormat(ctx.cwd, params);
      return { content: [{ type: "text", text: result.text }], details: { files: result.files } };
    },
  });

  pi.registerTool({
    name: "caravel_configure",
    label: "Configure API product",
    description: "Save API-key, upstream, and optional x402 settings without storing credential values.",
    parameters: Type.Object({
      upstreamBaseUrl: Type.Optional(Type.String()),
      apiKeyHeader: Type.Optional(Type.String()),
      x402Preset: Type.Optional(Type.Literal("monad-testnet")),
      x402PayTo: Type.Optional(Type.String()),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const result = await configureAndFormat(ctx.cwd, params);
      return { content: [{ type: "text", text: result.text }], details: { config: result.config } };
    },
  });

  pi.registerTool({
    name: "caravel_doctor",
    label: "Check Caravel",
    description: "Check the local Caravel workspace and SDK-generation runtime.",
    parameters: Type.Object({}),
    async execute(_toolCallId, _params, _signal, _onUpdate, ctx) {
      const result = await doctorAndFormat(ctx.cwd);
      return { content: [{ type: "text", text: result.text }], details: { checks: result.checks } };
    },
  });

  pi.registerTool({
    name: "caravel_uninstall",
    label: "Uninstall Caravel files",
    description: "Remove only files recorded by a previous Caravel installation.",
    parameters: Type.Object({ target: Type.Optional(Type.String()) }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const result = await uninstallAndFormat(params.target ?? ctx.cwd);
      return { content: [{ type: "text", text: result.text }], details: { files: result.files } };
    },
  });
}
