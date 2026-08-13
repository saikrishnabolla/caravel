import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { connectAndReport, loadAndFormatReport } from "../src/caravel/tools.mjs";

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
}
