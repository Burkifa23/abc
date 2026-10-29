import { test, expect } from "bun:test";
import { runChecks } from "./checks";
import type { CompileResult } from "./solc";

const ok: CompileResult = { errors: [], contracts: { Coin: [{ type: "function", name: "mint", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [], stateMutability: "nonpayable" }] } };
test("regex ignores comments", () => {
  const src = "// unchecked { ++i; }\ncontract A {}";
  expect(runChecks(src, ok, [{ type: "regex", pattern: "unchecked\s*\{", message: "use unchecked" }])[0].ok).toBe(false);
});
test("abi matches name, input types and mutability", () => {
  const c = { type: "abi", contract: "Coin", kind: "function", name: "mint", inputs: ["address", "uint256"], stateMutability: "nonpayable", message: "m" } as const;
  expect(runChecks("", ok, [c])[0].ok).toBe(true);
  expect(runChecks("", ok, [{ ...c, inputs: ["address"] }])[0].ok).toBe(false);
  expect(runChecks("", ok, [{ ...c, absent: true }])[0].ok).toBe(false);
});
test("compiles fails on error severity only", () => {
  const warn = { ...ok, errors: [{ severity: "warning", message: "", formattedMessage: "" }] } as CompileResult;
  expect(runChecks("", warn, [{ type: "compiles" }, { type: "noWarnings" }]).map(r => r.ok)).toEqual([true, false]);
});
