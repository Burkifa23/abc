import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { gate } from "./coverage-gate.mjs";

const TABLE = `
| File                      | % Lines         | % Statements    | % Branches    | % Funcs        |
|---------------------------|-----------------|-----------------|---------------|----------------|
| script/Deploy.s.sol       | 0.00% (0/10)    | 0.00% (0/10)    | 0.00% (0/2)   | 0.00% (0/1)    |
| src/A.sol                 | 95.00% (19/20)  | 94.00% (47/50)  | 90.00% (9/10) | 100.00% (4/4)  |
| src/B.sol                 | 85.00% (17/20)  | 84.00% (42/50)  | 80.00% (8/10) | 100.00% (4/4)  |
| src/interfaces/IA.sol     | 0.00% (0/0)     | 0.00% (0/0)     | 0.00% (0/0)   | 0.00% (0/0)    |
| Total                     | 90.00% (36/40)  | 89.00% (89/100) | 85.00% (17/20)| 100.00% (8/8)  |
`;

const cli = (min, input) =>
  spawnSync(process.execPath, [fileURLToPath(new URL("./coverage-gate.mjs", import.meta.url)), String(min)], { input, encoding: "utf8" });

test("one file at 85% fails the gate at 90 even though the average is 90", () => {
  assert.equal(cli(90, TABLE).status, 1);
  assert.deepEqual(gate(TABLE, 90).failing, [{ file: "src/B.sol", pct: 85 }]);
});

test("the gate at 80 passes", () => {
  assert.equal(cli(80, TABLE).status, 0);
});

test("interfaces, scripts and the Total row are ignored", () => {
  assert.deepEqual(gate(TABLE, 90).checked.map((c) => c.file), ["src/A.sol", "src/B.sol"]);
});

test("an empty table fails instead of passing silently", () => {
  assert.equal(cli(90, "").status, 1);
});
