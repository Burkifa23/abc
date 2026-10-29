import { expect, test } from "bun:test";
import { buildInput, parseOutput } from "./solc";

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
