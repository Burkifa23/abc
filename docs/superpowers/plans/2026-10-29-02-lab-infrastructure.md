# Lab Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make adding a Codespaces lab a matter of writing one folder. Each lab's metadata, devcontainer, Labs-page card, and CI proof (the starter fails, the solution passes) all come from that folder.

**Architecture:** Each `labs/NN-slug/lab.json` is the single source of truth. `scripts/sync-labs.mjs` (Node, no dependencies) generates `.devcontainer/<NN-slug>/devcontainer.json` and `site/src/labs.json`. `scripts/verify-lab.sh` runs one lab end to end in a temp copy. `.github/workflows/labs.yml` runs both on every change.

**Tech Stack:** Foundry (forge), forge-std, Node 22 built-in test runner (`node --test`), bash, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-29-abc-learning-platform-design.md`

## Global Constraints

- Lab folder: `labs/NN-slug/` where `NN` is two digits. It contains `lab.json`, `README.md`, `foundry.toml`, `src/`, `test/`, and `.solution/`, which mirrors the lab root (for example `.solution/src/Election.sol`).
- Solidity `pragma solidity ^0.8.24;` and the `// SPDX-License-Identifier: MIT` line in every `.sol` file.
- `foundry.toml` is the same in every lab: `src="src"`, `test="test"`, `libs=[]`, `remappings=["forge-std/=/opt/forge-std/src/"]`, `allow_paths=["/opt/forge-std"]`.
- forge-std lives at `/opt/forge-std`, pinned by `ARG FORGE_STD_VERSION` in `.devcontainer/Dockerfile`. CI reads the same value from that file.
- Students never run anything except `forge test` (and `forge test --mt test_NN` for learn labs).
- Codespaces URL: `https://codespaces.new/Burkifa23/abc?quickstart=1&devcontainer_path=.devcontainer%2F<NN-slug>%2Fdevcontainer.json`.
- No local forge on the planning machine. Run every `forge`/`verify-lab.sh` step in a Codespace or let CI run it on a pushed branch.

## Review Focus

1. **A lab whose starter already passes its tests** (for example a TODO body that happens to return the right default): `verify-lab.sh` must fail. Test in Task 2.
2. **A lab whose starter does not compile:** students would see compiler errors instead of red tests. `verify-lab.sh` must fail. Test in Task 2.
3. **A `lab.json` with a missing or misspelled field, or a folder name that doesn't match `NN-slug`:** sync fails with the file path and the field name. Test in Task 1.
4. **A generated file edited by hand and drifting from `lab.json`:** `sync-labs.mjs --check` exits 1 in CI. Test in Task 1.
5. **A forked repo with a different name:** `workspaceFolder` uses `${localWorkspaceFolderBasename}`, never the literal `abc`. Assertion in Task 1.

---

### Task 1: `lab.json`, sync script, existing lab migrated

**Files:**
- Create: `scripts/sync-labs.mjs`, `scripts/sync-labs.test.mjs`, `labs/README.md` (authoring guide, including the Lab Recipe below)
- Move: `labs/03-campus-elections` → `labs/08-campus-elections`; `.solution/Election.sol` → `.solution/src/Election.sol`
- Create: `labs/08-campus-elections/lab.json`
- Delete: `.devcontainer/03-campus-elections/` (now generated)
- Generated: `.devcontainer/08-campus-elections/devcontainer.json`, `site/src/labs.json`
- Modify: `.devcontainer/Dockerfile` (add `ARG FORGE_STD_VERSION=<latest forge-std tag at implementation time>` and `git clone --depth 1 --branch ${FORGE_STD_VERSION} …`)

**Interfaces:**
- Produces:
  - `lab.json`: `{ "n": number, "slug": string, "title": string, "kind": "learn" | "build", "summary": string, "concepts": string[], "adaptedFrom": string, "docs": string[], "openFiles": string[], "features"?: object, "extraCheck"?: string }`. `features` is copied into the devcontainer (lab 18 uses it for Node). `extraCheck` is a shell command that `verify-lab.sh` runs after the solution tests pass. `docs` are lesson ids from plan 01, for example `"m07-by-example/01-voting"`.
  - `readLabs(root: string): Lab[]` (sorted by `n`). It throws `Error("<path>: missing <field>")` or `Error("<dir>: folder must be <NN>-<slug>")`.
  - `devcontainerFor(lab: Lab): object`: name `"Lab NN: <title>"`, `build.dockerfile: "../Dockerfile"`, `workspaceFolder: "/workspaces/${localWorkspaceFolderBasename}/labs/<NN-slug>"`, `customizations.codespaces.openFiles = lab.openFiles`, extension `NomicFoundation.hardhat-solidity`, `files.exclude` for `.solution`, `out`, `cache`, `lab.json`, and `postAttachCommand: "forge build --silent && echo 'Run: forge test'"`.
  - `labsIndex(labs: Lab[]): LabEntry[]` where `LabEntry = Lab & { dir: string; codespaceUrl: string; sourceUrl: string }`, and `sourceUrl = https://github.com/Burkifa23/abc/tree/main/labs/<NN-slug>`.
  - CLI: `node scripts/sync-labs.mjs` writes the files. `--check` writes nothing, exits 1, and prints the stale paths if any output would change.

- [ ] **Step 1: Write the failing tests** in `scripts/sync-labs.test.mjs` (using `node:test` and `node:assert/strict`)

```js
test("devcontainer uses repo-name variable and lab folder", () => {
  const d = devcontainerFor({ n: 8, slug: "campus-elections", title: "Secure Campus Elections", openFiles: ["README.md"] });
  assert.equal(d.workspaceFolder, "/workspaces/${localWorkspaceFolderBasename}/labs/08-campus-elections");
  assert.equal(d.build.dockerfile, "../Dockerfile");
});
test("features pass through to devcontainer", () => {
  assert.deepEqual(devcontainerFor({ n: 18, slug: "x", title: "X", openFiles: [], features: { a: {} } }).features, { a: {} });
});
test("index builds codespace url", () => {
  const [e] = labsIndex([{ n: 8, slug: "campus-elections" }]);
  assert.match(e.codespaceUrl, /devcontainer_path=\.devcontainer%2F08-campus-elections%2Fdevcontainer\.json$/);
});
test("readLabs reports missing field with path", () => { /* temp dir labs/01-x/lab.json without title */
  assert.throws(() => readLabs(tmp), /labs[\\/]01-x[\\/]lab\.json: missing title/);
});
test("readLabs rejects folder/slug mismatch", () => { /* labs/02-y with slug "z" */
  assert.throws(() => readLabs(tmp2), /folder must be 02-z/);
});
```

- [ ] **Step 2: Run the tests and confirm they fail.** `node --test scripts/`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement `scripts/sync-labs.mjs`.** Export the three functions. The CLI runs when `import.meta.url` is the entry script. Output is JSON with 2-space indentation and a trailing newline.
- [ ] **Step 4: Run the tests and confirm they pass.** `node --test scripts/`. Expected: PASS (5 tests).
- [ ] **Step 5: Migrate the existing lab.** Do the moves listed above. Write `labs/08-campus-elections/lab.json` with `n: 8`, `kind: "build"`, `adaptedFrom: "Plan.md Workshop 3; Solidity docs \"Voting\""`, `docs: ["m07-by-example/01-voting"]`, `openFiles: ["README.md", "src/Election.sol"]`. Then run `node scripts/sync-labs.mjs`, then `node scripts/sync-labs.mjs --check`. Expected: the second command exits 0.
- [ ] **Step 6: Commit.** `git add -A scripts labs .devcontainer site/src/labs.json && git commit -m "feat(labs): lab.json as source of truth, generated devcontainers"`

---

### Task 2: `verify-lab.sh`

**Files:**
- Create: `scripts/verify-lab.sh`, `scripts/fixtures/lab-good/` and `scripts/fixtures/lab-bad/` (each a minimal lab: `foundry.toml`, `src/Box.sol`, `test/Box.t.sol`, `.solution/src/Box.sol`). In `lab-bad`, the starter already passes.

**Interfaces:**
- Produces: `scripts/verify-lab.sh <lab-dir>`. It copies the lab to `mktemp -d`. The steps, with exit codes:
  1. `forge build` must succeed, else print "FAIL: starter does not compile" and exit 1.
  2. `forge test` must fail, else print "FAIL: starter already passes" and exit 1.
  3. Copy `.solution/.` over the copy.
  4. `forge test` must pass, else print "FAIL: solution fails" and exit 1.
  5. If `lab.json` has `extraCheck`, run it with `bash -c` inside the temp copy, with `REPO_ROOT` exported as the repo root. If it fails, print "FAIL: extra check" and exit 1.
  6. Print "PASS <lab-dir>" and exit 0.

- [ ] **Step 1: Write the fixtures.** `Box` has `function get() external pure returns (uint256)`. The test asserts `get() == 42`. The `lab-good` starter returns `0` and its solution returns `42`. The `lab-bad` starter already returns `42`.
- [ ] **Step 2: Run the script before it exists to confirm failure.** `bash scripts/verify-lab.sh scripts/fixtures/lab-good`. Expected: "No such file".
- [ ] **Step 3: Implement `verify-lab.sh`** with `set -euo pipefail`, the steps above, and `trap 'rm -rf "$tmp"' EXIT`.
- [ ] **Step 4: Verify in a Codespace.** `bash scripts/verify-lab.sh scripts/fixtures/lab-good` prints `PASS`. `bash scripts/verify-lab.sh scripts/fixtures/lab-bad` prints `FAIL: starter already passes` and exits 1. `bash scripts/verify-lab.sh labs/08-campus-elections` prints `PASS`.
- [ ] **Step 5: Commit.** `git add scripts && git commit -m "feat(labs): verify-lab script"`

---

### Task 3: Labs CI

**Files:**
- Create: `.github/workflows/labs.yml`

- [ ] **Step 1: Write the workflow.**
  - Trigger on push and PR for paths `labs/**`, `.devcontainer/**`, `scripts/**`.
  - Job `sync`: `node --test scripts/` and `node scripts/sync-labs.mjs --check`.
  - Job `list`: outputs `labs=$(ls -d labs/[0-9]*/ | jq -R . | jq -sc .)`.
  - Job `verify`: matrix over `fromJson(needs.list.outputs.labs)` plus the two fixtures. Its steps:
    1. `foundry-rs/foundry-toolchain@v1`.
    2. `FORGE_STD_VERSION=$(grep -oP 'ARG FORGE_STD_VERSION=\K\S+' .devcontainer/Dockerfile)`, then `sudo git clone --depth 1 --branch "$FORGE_STD_VERSION" https://github.com/foundry-rs/forge-std /opt/forge-std`.
    3. `bash scripts/verify-lab.sh <dir>`. For `lab-bad` only, expect a non-zero exit: `! bash scripts/verify-lab.sh scripts/fixtures/lab-bad`.
- [ ] **Step 2: Verify.** Push the branch and open the Actions run. Expected: `sync` is green, and `verify` is green for `labs/08-campus-elections/`, `lab-good`, and `lab-bad` (negated).
- [ ] **Step 3: Commit.** `git add .github/workflows/labs.yml && git commit -m "ci: verify every lab's starter and solution"`

---

### Task 4: Labs page driven by `labs.json`

**Files:**
- Modify: `site/src/data.ts` (remove `Lab`, `labs`, `codespace`; keep `repo` and `socials`), `site/src/components/LabCard.astro`, `site/src/pages/labs.astro`, `site/src/pages/index.astro`

**Interfaces:**
- Consumes: `site/src/labs.json` (`LabEntry[]`, Task 1)
- Produces: `<LabCard lab={LabEntry} />`. It shows `Lab NN · learn|build`, the title, summary, concept chips, "Adapted from …" in muted text, "Open in Codespaces" (primary), "Source" (outline), and links to the related lessons (`${base}docs/<id>/`).

- [ ] **Step 1: Update the components** as described. On `labs.astro`, put a "Learn" / "Build" filter row above the grid, made of two `<a href="#learn">` / `#build` anchors to sections. Use no JavaScript.
- [ ] **Step 2: Verify.** `cd site && bun --bun astro build`. Expected: the build succeeds and `dist/labs/index.html` contains `08-campus-elections%2Fdevcontainer.json`.
- [ ] **Step 3: Commit.** `git commit -am "feat(site): labs page from generated labs.json"`

---

## Lab Recipe (each lab plan follows this)

Every lab plan in `docs/superpowers/plans/labs/` gives the lab's interface, its tests, its starter TODOs, and its README content. It then runs these two tasks. Run all `forge` steps in a Codespace (any lab's container has the tools) or rely on CI.

**Task A: Tests and solution**
1. Create `labs/NN-slug/foundry.toml` (copied from lab 08) and `test/<Name>.t.sol` with every test from the lab plan's test table. Learn labs number their tests `test_NN_*` to match README steps. Build labs name them `test_US<k>_*` to match user stories.
2. Write the full solution in `src/` using the plan's interface.
3. `cd labs/NN-slug && forge test`. Expected: every test passes.
4. `mkdir -p .solution/src && cp src/*.sol .solution/src/`
5. Commit: `test(lab-NN): tests and reference solution`.

**Task B: Starter, README, metadata**
1. Turn `src/` into the starter. Keep every declaration the tests reference (types, errors, events, state variables, signatures). Replace function bodies with `// TODO <k>: …` comments as the plan lists them. Bodies that need a return value end without one, so the default is returned. Add `revert("TODO")` only where a default would accidentally pass a test.
2. Write `README.md` with the plan's problem statement, steps or user stories, the commands, and a "Discuss" question.
3. Write `lab.json` from the plan's metadata. Run `node scripts/sync-labs.mjs`.
4. `bash scripts/verify-lab.sh labs/NN-slug`. Expected: `PASS labs/NN-slug`.
5. Commit: `feat(lab-NN): <title> lab`.
