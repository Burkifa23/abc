import { expect, test } from "bun:test";
import { buildInput, parseOutput, SOLC_BUILD } from "./solc";
const URL_OK = "https://binaries.soliditylang.org/bin/" + SOLC_BUILD;

test("buildInput wraps source as standard JSON", () => {
  const i = JSON.parse(buildInput("contract A {}"));
  expect(i.language).toBe("Solidity");
  expect(i.sources["Exercise.sol"].content).toBe("contract A {}");
  expect(i.settings.optimizer.enabled).toBe(false);
});

test("parseOutput extracts errors and ABIs", () => {
  const r = parseOutput('{"errors":[{"severity":"warning","message":"w","formattedMessage":"W"}],"contracts":{"Exercise.sol":{"A":{"abi":[{"type":"function","name":"f","inputs":[],"outputs":[],"stateMutability":"pure"}]}}}}');
  expect(r.contracts.A[0].name).toBe("f");
  expect(r.errors.length).toBe(1);
  expect(r.errors[0].severity).toBe("warning");
});

test("parseOutput tolerates missing keys", () => {
  expect(parseOutput("{}")).toEqual({ errors: [], contracts: {} });
});

test("worker answers two messages sent before soljson is ready", async () => {
  const g: any = globalThis;
  const posted: any[] = [];
  let imports = 0;
  g.self = {};
  g.postMessage = (m: any) => posted.push(m);
  g.importScripts = () => {
    imports++;
    g.Module = { calledRun: false, cwrap: () => (i: string) => "out:" + i };
  };
  new Function(await Bun.file(new URL("../../public/solc-worker.js", import.meta.url)).text())();
  // Function-scoped lets are local, so onmessage is the only thing exposed on self.
  const h = g.self.onmessage;
  const a = h({ data: { id: 1, url: URL_OK, input: "a" } });
  const b = h({ data: { id: 2, url: URL_OK, input: "b" } });
  g.Module.onRuntimeInitialized();
  await Promise.all([a, b]);
  expect(imports).toBe(1);
  expect(posted).toEqual([{ id: 1, output: "out:a" }, { id: 2, output: "out:b" }]);

});

test("worker replies with id and error when compile throws after load", async () => {
  const g: any = globalThis;
  const posted: any[] = [];
  g.self = {};
  g.postMessage = (m: any) => posted.push(m);
  g.importScripts = () => { g.Module = { calledRun: true, cwrap: () => () => { throw new Error("boom"); } }; };
  new Function(await Bun.file(new URL("../../public/solc-worker.js", import.meta.url)).text())();
  await g.self.onmessage({ data: { id: 7, url: URL_OK, input: "x" } });
  expect(posted).toEqual([{ id: 7, error: "Error: boom" }]);
});

test("compile rejects and resets the worker when the compiler never replies", async () => {
  const g: any = globalThis;
  let made = 0, terminated = 0;
  g.Worker = class { constructor() { made++; } postMessage() {} terminate() { terminated++; } };
  const { compile } = await import("./solc");
  await expect(compile("x", 20)).rejects.toThrow("Compiler failed to load");
  expect(terminated).toBe(1);
  compile("y", 20).catch(() => {});
  expect(made).toBe(2);
  await new Promise((r) => setTimeout(r, 40));
});

test("worker refuses a compiler URL off the pinned host and version", async () => {
  const g: any = globalThis;
  const posted: any[] = [];
  let imports = 0;
  g.self = {};
  g.postMessage = (m: any) => posted.push(m);
  g.importScripts = () => { imports++; };
  new Function(await Bun.file(new URL("../../public/solc-worker.js", import.meta.url)).text())();
  await g.self.onmessage({ data: { id: 9, url: "https://evil.example/soljson.js", input: "x" } });
  expect(imports).toBe(0);
  expect(posted).toEqual([{ id: 9, loadError: true, error: "untrusted compiler URL" }]);
});
