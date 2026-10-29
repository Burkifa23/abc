import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { devcontainerFor, labsIndex, readLabs } from "./sync-labs.mjs";

const full = { n: 1, slug: "x", title: "T", kind: "learn", summary: "s", concepts: [], adaptedFrom: "a", docs: [], openFiles: [] };
function mk(dir, lab) {
  const root = mkdtempSync(join(tmpdir(), "labs-"));
  mkdirSync(join(root, "labs", dir), { recursive: true });
  writeFileSync(join(root, "labs", dir, "lab.json"), JSON.stringify(lab));
  return root;
}

test("devcontainer uses repo-name variable and lab folder", () => {
  const d = devcontainerFor({ n: 8, slug: "campus-elections", title: "Secure Campus Elections", openFiles: ["README.md"] });
  assert.equal(d.workspaceFolder, "/workspaces/${localWorkspaceFolderBasename}/labs/08-campus-elections");
  assert.equal(d.build.dockerfile, "../Dockerfile");
  assert.equal(d.name, "Lab 08: Secure Campus Elections");
});
test("features pass through to devcontainer", () => {
  assert.deepEqual(devcontainerFor({ n: 18, slug: "x", title: "X", openFiles: [], features: { a: {} } }).features, { a: {} });
});
test("index builds codespace url", () => {
  const [e] = labsIndex([{ n: 8, slug: "campus-elections" }]);
  assert.match(e.codespaceUrl, /devcontainer_path=\.devcontainer%2F08-campus-elections%2Fdevcontainer\.json$/);
  assert.equal(e.sourceUrl, "https://github.com/Burkifa23/abc/tree/main/labs/08-campus-elections");
});
test("readLabs reports missing field with path", () => {
  const { title, ...noTitle } = full;
  assert.throws(() => readLabs(mk("01-x", noTitle)), /labs[\\/]01-x[\\/]lab\.json: missing title/);
});
test("readLabs rejects folder/slug mismatch", () => {
  assert.throws(() => readLabs(mk("02-y", { ...full, n: 2, slug: "z" })), /folder must be 02-z/);
});
