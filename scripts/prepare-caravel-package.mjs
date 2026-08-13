import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const target = resolve(root, "packages/caravel");
const entries = [
  ["bin", "bin"],
  ["extensions/caravel.ts", "extensions/caravel.ts"],
  ["runtime", "runtime"],
  ["skills/caravel-agentic-commerce", "skills/caravel-agentic-commerce"],
  ["src/caravel", "src/caravel"],
  ["README.md", "README.md"],
  ["LICENSE", "LICENSE"],
];

for (const [, destination] of entries) await rm(resolve(target, destination), { recursive: true, force: true });
for (const [source, destination] of entries) {
  await mkdir(resolve(target, destination, ".."), { recursive: true });
  await cp(resolve(root, source), resolve(target, destination), { recursive: true });
}
for (const name of await readdir(resolve(target, "src/caravel"))) {
  if (name.endsWith(".test.ts") || name === "payment.mjs") await rm(resolve(target, "src/caravel", name), { force: true });
}
