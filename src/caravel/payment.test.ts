import { describe, expect, it } from "vitest";
import { verifyPaidEndpoint } from "./payment.mjs";

describe("Caravel payment verification", () => {
  it("requires a test buyer key", async () => {
    await expect(verifyPaidEndpoint("https://example.com", { privateKey: "invalid" })).rejects.toThrow("valid test buyer private key");
  });
});
