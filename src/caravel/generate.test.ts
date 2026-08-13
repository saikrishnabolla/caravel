import { describe, expect, it } from "vitest";
import { fernGenerateArguments } from "./generate.mjs";

describe("Caravel SDK generation", () => {
  it("runs Fern locally without login", () => {
    expect(fernGenerateArguments()).toEqual(["generate", "--group", "local", "--local", "--runner", "docker", "--no-prompt"]);
  });
});
