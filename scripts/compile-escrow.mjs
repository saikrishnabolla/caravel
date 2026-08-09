import { readFile, mkdir, writeFile } from "node:fs/promises";
import solc from "solc";

const source = await readFile(new URL("../contracts/RaingenticCommerceEscrow.sol", import.meta.url), "utf8");
const input = { language: "Solidity", sources: { "RaingenticCommerceEscrow.sol": { content: source } }, settings: { optimizer: { enabled: true, runs: 200 }, outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } } };
const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (output.errors ?? []).filter(error => error.severity === "error");
if (errors.length) throw new Error(errors.map(error => error.formattedMessage).join("\n"));
const contract = output.contracts["RaingenticCommerceEscrow.sol"].RaingenticCommerceEscrow;
const artifact = { contractName: "RaingenticCommerceEscrow", compiler: solc.version(), abi: contract.abi, bytecode: `0x${contract.evm.bytecode.object}` };
const outDir = new URL("../src/contracts/", import.meta.url);
await mkdir(outDir, { recursive: true });
await writeFile(new URL("raingentic-commerce-escrow.json", outDir), `${JSON.stringify(artifact, null, 2)}\n`);
console.log(`Compiled ${artifact.contractName} with ${artifact.compiler}`);
