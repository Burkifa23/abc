import type { CompileResult } from "./solc";

export type Check =
  | { type: "compiles" }
  | { type: "noWarnings" }
  | { type: "regex"; pattern: string; flags?: string; message: string }
  | { type: "abi"; contract: string; kind: "function" | "event" | "error"; name: string; inputs: string[]; outputs?: string[]; stateMutability?: "pure" | "view" | "nonpayable" | "payable"; absent?: boolean; message: string };

// ponytail: regex strip ignores comment markers inside string literals; upgrade to the solc AST if that bites.
export const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const same = (a: string[], b?: { type: string }[]) => a.length === (b?.length ?? 0) && a.every((t, i) => t === b![i].type);

export function runChecks(source: string, result: CompileResult, checks: Check[]): { ok: boolean; message: string }[] {
  const code = stripComments(source);
  return checks.map((c) => {
    switch (c.type) {
      case "compiles":
        return { ok: !result.errors.some((e) => e.severity === "error"), message: "Compiles without errors" };
      case "noWarnings":
        return { ok: !result.errors.some((e) => e.severity === "warning"), message: "No compiler warnings" };
      case "regex":
        return { ok: new RegExp(c.pattern, c.flags).test(code), message: c.message };
      case "abi": {
        const hit = (result.contracts[c.contract] ?? []).some((i) =>
          i.type === c.kind && i.name === c.name && same(c.inputs, i.inputs) &&
          (!c.outputs || same(c.outputs, i.outputs)) &&
          (!c.stateMutability || i.stateMutability === c.stateMutability));
        return { ok: c.absent ? !hit : hit, message: c.message };
      }
    }
  });
}
