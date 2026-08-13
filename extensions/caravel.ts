import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { buildAndFormat, connectAndReport, generateAndFormat, installAndFormat, loadAndFormatReport } from "../src/caravel/tools.mjs";

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
}
