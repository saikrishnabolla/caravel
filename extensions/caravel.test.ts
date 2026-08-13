import { describe, expect, it } from "vitest";
import caravelExtension from "./caravel";

describe("Caravel Pi extension", () => {
  it("registers the deterministic connect and report tools", () => {
    const tools: Array<{ name: string }> = [];
    caravelExtension({
      registerTool(tool: { name: string }) {
        tools.push(tool);
      },
    } as never);

    expect(tools.map((tool) => tool.name)).toEqual(["caravel_connect", "caravel_report", "caravel_build", "caravel_generate", "caravel_install", "caravel_configure", "caravel_doctor", "caravel_uninstall"]);
  });
});
