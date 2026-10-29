# Lab 20: Open-Source Africa Capstone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `Plan.md` Workshop 7. Teams polish their civic contracts (elections, anonymous access, procurement, land registry) into one open-source library that meets published interfaces and quality gates, ready to release under the club's name.

**Architecture:** `labs/20-open-source-africa/` built with the Lab Recipe (plan 02). The starter gives **interfaces** (`src/interfaces/ICivicElection.sol`, `IClubAccess.sol`, `ITender.sol`, `ILandRegistry.sol`) and **conformance tests**. Teams add implementations in `src/`. The reference solution adapts the solutions from labs 08, 11, 16 and 17. `extraCheck` adds the quality gates.

**Tech Stack:** Foundry (forge test, forge fmt, forge coverage), forge-std, Solidity ^0.8.24.

**Spec:** `docs/superpowers/specs/2026-10-29-abc-learning-platform-design.md`. Recipe: plan 02 § Lab Recipe.

**Adapted from:** `Plan.md` Workshop 7 and Solana "build and deploy your freeform app".

## Global Constraints

- Plan 02 constraints apply. **Depends on** labs 08, 11, 16 and 17 being merged, because their solutions are the source for the reference implementation.
- Each interface lists exactly the external functions, events and errors from its lab plan, so code that passed the earlier lab passes conformance with renames at most.
- Implementations are named `CivicElection`, `ClubAccess`, `Tender`, `LandRegistry` and live in `src/<Name>.sol`. A factory test deploys each by name.
- Quality gates (`extraCheck`): `forge fmt --check && forge coverage --report summary | node "$REPO_ROOT/scripts/coverage-gate.mjs" 90`. `scripts/coverage-gate.mjs` reads forge's summary table from stdin and exits 1 if line coverage of any `src/*.sol` (excluding `src/interfaces/`) is below the argument.

## Review Focus

1. **A team implements an interface but leaves a function reverting "TODO".** The conformance tests exercise every interface function at least once, so it fails. Checked by grep in Task A Step 3: every function in `src/interfaces/*.sol` appears in some test.
2. **Unformatted code.** `forge fmt --check` fails the gate. Verified in Task B Step 3 with a deliberately misformatted file.
3. **Coverage below 90% on one contract while the average is fine.** The gate is per file. `coverage-gate.mjs` has its own `node:test` test with a fixture table where one file is at 85%.
4. **NatSpec missing on public functions.** `forge doc` needs it. The README checklist requires `@notice` on every external function. It is not machine-checked, and the README says so.

## lab.json

`{ "n": 20, "slug": "open-source-africa", "title": "Open-Source Africa Capstone", "kind": "build", "summary": "Ship your civic contracts as one tested, documented, open-source library.", "concepts": ["interfaces", "conformance tests", "code coverage", "formatting", "NatSpec", "releasing"], "adaptedFrom": "Plan.md Workshop 7 + Solana freeform app", "docs": ["m02-source-and-structure/03-comments-and-natspec", "m02-source-and-structure/05-style-guide", "m08-security/05-recommendations"], "openFiles": ["README.md", "src/interfaces/ICivicElection.sol"], "extraCheck": "forge fmt --check && forge coverage --report summary | node \"$REPO_ROOT/scripts/coverage-gate.mjs\" 90" }`

`extraCheck` runs inside the temp copy made by `verify-lab.sh`, which exports `REPO_ROOT` (plan 02 Task 2).

## Interfaces (starter, complete)

Each `I<Name>` copies the external signatures, events and custom errors from its lab plan's Interface block:
- `ICivicElection`: lab 08.
- `IClubAccess`: lab 11.
- `ITender`: lab 16, including `phase()` and the `Phase` enum.
- `ILandRegistry`: lab 17, extending `IERC721`.

## Tests (`test/Conformance.t.sol`)

| Test | Asserts |
|---|---|
| `test_01_ElectionLifecycle` | register, delegate, vote, warp, winner |
| `test_02_ElectionGuards` | each custom error from `ICivicElection` is triggerable |
| `test_03_AccessLifecycle` | add, commit, roll, enter |
| `test_04_AccessGuards` | front-run, reuse, revoke |
| `test_05_TenderLifecycle` | bid, reveal, finalize, deliver, withdraw to zero balance |
| `test_06_TenderGuards` | boundaries, bad reveal, no winner |
| `test_07_LandLifecycle` | register, transfer, history |
| `test_08_LandGuards` | double title, dispute, court order |
| `test_09_SupportsInterfaces` | LandRegistry ERC-165 ids |

## Starter

The interfaces and conformance tests are complete. Each `src/<Name>.sol` declares `contract <Name> is I<Name>` with every interface function present and a `revert("TODO")` body. An empty `contract X is IX {}` would be abstract and fail to compile.

## README

The release checklist:
1. Conformance tests green.
2. `forge fmt`.
3. Coverage ≥ 90% per contract.
4. NatSpec on all external functions.
5. A `SECURITY.md` with a threat list per contract.
6. A `CHANGELOG.md`.
7. Tag `v1.0.0` and publish a GitHub release on the team's fork.

**Discuss:** What would a Ghanaian district assembly need, beyond code, before it could rely on this library?

---

### Task A: Tests and solution

- [ ] **Step 1:** Create `labs/20-open-source-africa/foundry.toml` (copied from lab 08) and the test file with every test in the Tests table.
- [ ] **Step 2:** Write the full solution in `src/CivicElection.sol`, `src/ClubAccess.sol`, `src/Tender.sol`, `src/LandRegistry.sol` against the Interface above.
- [ ] **Step 3: Run in a Codespace.** `cd labs/20-open-source-africa && forge test`. Expected: `9 passed; 0 failed`.
- [ ] **Step 4:** `mkdir -p .solution/src && cp src/CivicElection.sol src/ClubAccess.sol src/Tender.sol src/LandRegistry.sol .solution/src/`
- [ ] **Step 5: Commit.** `git add labs/20-open-source-africa && git commit -m "test(lab-20): tests and reference solution"`

### Task B: Starter, README, metadata

- [ ] **Step 1:** Turn `src/CivicElection.sol`, `src/ClubAccess.sol`, `src/Tender.sol`, `src/LandRegistry.sol` into the starter, using the Starter section above. Keep every declaration the tests use.
- [ ] **Step 2:** Write `README.md` and `lab.json` as above, then run `node scripts/sync-labs.mjs`.
- [ ] **Step 3: Verify.** `bash scripts/verify-lab.sh labs/20-open-source-africa`. Expected: `PASS labs/20-open-source-africa`.
- [ ] **Step 4: Commit.** `git add -A labs/20-open-source-africa .devcontainer site/src/labs.json && git commit -m "feat(lab-20): Open-Source Africa Capstone lab"`


Additional step in Task A: before Step 1, write `scripts/coverage-gate.mjs` and `scripts/coverage-gate.test.mjs`. The fixture has `src/A.sol` at 95% and `src/B.sol` at 85%: the gate at 90 exits 1, and at 80 exits 0. Run `node --test scripts/`. Expected: pass. Commit it separately: `feat(scripts): coverage gate`.
