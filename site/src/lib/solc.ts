export const SOLC_BUILD = "soljson-v0.8.38+commit.1835d247.js";

export type SolcError = { severity: "error" | "warning" | "info"; formattedMessage: string; message: string };
export type AbiItem = { type: string; name?: string; inputs?: { type: string }[]; outputs?: { type: string }[]; stateMutability?: string };
export type CompileResult = { errors: SolcError[]; contracts: Record<string, AbiItem[]> };

export function buildInput(source: string): string {
  return JSON.stringify({
    language: "Solidity",
    sources: { "Exercise.sol": { content: source } },
    settings: { optimizer: { enabled: false }, outputSelection: { "*": { "*": ["abi"] } } },
  });
}

export function parseOutput(json: string): CompileResult {
  const o = JSON.parse(json);
  const contracts: Record<string, AbiItem[]> = {};
  for (const [name, c] of Object.entries<any>(o.contracts?.["Exercise.sol"] ?? {})) contracts[name] = c.abi ?? [];
  return { errors: o.errors ?? [], contracts };
}

// Browser only: one shared worker, replies matched by id.
let worker: Worker | undefined;
let nextId = 0;
const pending = new Map<number, { ok: (r: CompileResult) => void; fail: (e: Error) => void }>();

function failAll() {
  worker?.terminate();
  worker = undefined; // next compile() retries with a fresh worker
  for (const p of pending.values()) p.fail(new Error("Compiler failed to load"));
  pending.clear();
}

export function compile(source: string): Promise<CompileResult> {
  if (!worker) {
    worker = new Worker(import.meta.env.BASE_URL + "solc-worker.js");
    worker.onerror = failAll;
    worker.onmessage = (e) => {
      const { id, output, error, loadError } = e.data;
      if (loadError) return failAll();
      const p = pending.get(id);
      pending.delete(id);
      if (error) return p?.fail(new Error(error));
      try { p?.ok(parseOutput(output)); } catch { p?.fail(new Error("Compiler failed to load")); }
    };
  }
  const id = nextId++;
  return new Promise((ok, fail) => {
    pending.set(id, { ok, fail });
    worker!.postMessage({ id, url: `https://binaries.soliditylang.org/bin/${SOLC_BUILD}`, input: buildInput(source) });
  });
}
