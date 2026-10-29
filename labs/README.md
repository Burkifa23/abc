# Authoring a lab

Each lab is a folder `labs/NN-slug/` (NN two digits) with `lab.json`, `README.md`, `foundry.toml`, `src/`, `test/`, and `.solution/` (mirrors the lab root, e.g. `.solution/src/Election.sol`). Every `.sol` file starts with `// SPDX-License-Identifier: MIT` and `pragma solidity ^0.8.24;`. `foundry.toml` is identical in every lab (copy lab 08's).

`lab.json` is the source of truth. After editing it run `node scripts/sync-labs.mjs`; this generates `.devcontainer/NN-slug/devcontainer.json` and `site/src/labs.json`. `node scripts/sync-labs.mjs --check` fails if either is stale. Fields: `n`, `slug`, `title`, `kind` (`learn`|`build`), `summary`, `concepts`, `adaptedFrom`, `docs` (lesson ids), `openFiles`, optional `features` (copied into the devcontainer) and `extraCheck` (shell command run after the solution tests pass).

## Lab Recipe

**A: Tests and solution**
1. Create `foundry.toml` and `test/<Name>.t.sol`. Learn labs name tests `test_NN_*` to match README steps; build labs name them `test_US<k>_*` to match user stories.
2. Write the full solution in `src/`.
3. `forge test` must pass.
4. `mkdir -p .solution/src && cp src/*.sol .solution/src/`
5. Commit: `test(lab-NN): tests and reference solution`.

**B: Starter, README, metadata**
1. Turn `src/` into the starter: keep every declaration the tests reference, replace function bodies with `// TODO <k>: ...`. Add `revert("TODO")` only where a default return would accidentally pass a test.
2. Write `README.md`: problem statement, steps or user stories, commands, a "Discuss" question.
3. Write `lab.json`, run `node scripts/sync-labs.mjs`.
4. `bash scripts/verify-lab.sh labs/NN-slug` must print `PASS labs/NN-slug`.
5. Commit: `feat(lab-NN): <title> lab`.
