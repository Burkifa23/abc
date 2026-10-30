# Lab 11: Anonymous Club Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `Plan.md` Workshop 4. Members prove they hold a valid club credential without revealing their student ID. A commit-reveal step stops someone copying a credential out of the mempool.

**Architecture:** `labs/11-anonymous-access/` built with the Lab Recipe (plan 02). The admin registers **commitments** `keccak256(abi.encodePacked(secret))`. Secrets are handed out offline, one per student. Entry is two transactions: `commitEntry(keccak256(abi.encodePacked(msg.sender, secret)))`, then in a later block `enter(secret)`. Each secret works once (a nullifier).

**Tech Stack:** Foundry, forge-std, Solidity ^0.8.24.

**Spec:** `docs/superpowers/specs/2026-10-29-abc-learning-platform-design.md`. Recipe: plan 02 § Lab Recipe.

**Adapted from:** `Plan.md` Workshop 4 ("keccak256 and abi.encodePacked to verify data securely", plus the "Garbage In" discussion).

## Global Constraints

- Plan 02 constraints apply.
- The reveal must be in a strictly later block than the commit: `block.number > committedAt[msg.sender]`.

## Review Focus

1. **Front-running:** mallory sees ama's `enter(secret)` and submits it first. That fails, because mallory's sealed commit (bound to mallory's address) doesn't match. `test_US4_FrontRunFails`.
2. **The same secret used twice** (credential sharing). Second use reverts `AlreadyUsed`. `test_US5_OneUse`.
3. **Reveal in the same block as the commit.** `RevealTooEarly`. `test_US4_SameBlock`.
4. **A revoked commitment with a pending entry.** Revert `UnknownCommitment`. `test_US6_RevokedCannotEnter`.
5. **`abi.encodePacked` collisions with two dynamic types.** Avoided because every packed value is fixed-size (`address`, `bytes32`). The README explains why `encodePacked(string, string)` would be unsafe.

## lab.json

`{ "n": 11, "slug": "anonymous-access", "title": "Anonymous Club Access", "kind": "build", "summary": "Prove you're a member without revealing who you are, and stop copycats with commit-reveal.", "concepts": ["keccak256", "abi.encodePacked", "commitments", "nullifiers", "commit-reveal", "front-running"], "adaptedFrom": "Plan.md Workshop 4", "docs": ["m04-units-and-globals/04-errors-math-crypto", "m09-under-the-hood/05-abi-specification", "m07-by-example/03-blind-auction"], "openFiles": ["README.md", "src/ClubAccess.sol"] }`

## Interface (`src/ClubAccess.sol`)

```solidity
contract ClubAccess {
    error NotAdmin(); error UnknownCommitment(); error AlreadyUsed();
    error NoPendingEntry(); error RevealTooEarly(); error SealMismatch();
    event MemberAdded(bytes32 indexed commitment);
    event MemberRevoked(bytes32 indexed commitment);
    event EntryCommitted(address indexed who, bytes32 sealed);
    event AccessGranted(address indexed who);

    address public immutable admin;
    mapping(bytes32 => bool) public isMember;       // commitment → active
    mapping(bytes32 => bool) public used;           // commitment → spent
    mapping(address => bytes32) public sealedEntry;
    mapping(address => uint256) public committedAt;
    mapping(address => bool) public hasAccess;

    function commitmentOf(bytes32 secret) public pure returns (bytes32);              // keccak256(abi.encodePacked(secret))
    function sealFor(address who, bytes32 secret) public pure returns (bytes32);      // keccak256(abi.encodePacked(who, secret))
    function addMember(bytes32 commitment) external;      // admin
    function revokeMember(bytes32 commitment) external;   // admin
    function commitEntry(bytes32 sealed) external;
    function enter(bytes32 secret) external;
}
```

## User stories → tests

| # | Story | Tests |
|---|---|---|
| US1 | The admin registers commitments, never IDs | `test_US1_AddMember` (event), `test_US1_OnlyAdmin` |
| US2 | Helpers compute commitments and seals | `test_US2_Helpers` (equal to manual keccak) |
| US3 | A member commits a sealed entry | `test_US3_Commit` (stored seal, block number, event) |
| US4 | A later block, reveal grants access | `test_US4_Enter` (`vm.roll(+1)`, `hasAccess`, `AccessGranted`), `test_US4_SameBlock`, `test_US4_NoCommit`, `test_US4_WrongSecret` (`SealMismatch`), `test_US4_FrontRunFails` |
| US5 | Each credential works once | `test_US5_OneUse` |
| US6 | The admin can revoke a credential | `test_US6_Revoke`, `test_US6_RevokedCannotEnter` |
| US7 | Unknown secrets are rejected | `test_US7_NotAMember` (`UnknownCommitment`) |

## Starter

The declarations and both pure helpers' signatures are given. Bodies, including the helpers, are TODO.

## README

The problem, the user stories, and a two-part diagram (commit, then reveal) in ASCII. **Discuss (Garbage In):** If a corrupt admin adds a commitment for a fake student, what can the contract do about it? What social or legal process has to sit around the code?

---

### Task A: Tests and solution

- [ ] **Step 1:** Create `labs/11-anonymous-access/foundry.toml` (copied from lab 08) and the test file with every test in the Tests table.
- [ ] **Step 2:** Write the full solution in `src/ClubAccess.sol` against the Interface above.
- [ ] **Step 3: Run in a Codespace.** `cd labs/11-anonymous-access && forge test`. Expected: `13 passed; 0 failed`.
- [ ] **Step 4:** `mkdir -p .solution/src && cp src/ClubAccess.sol .solution/src/`
- [ ] **Step 5: Commit.** `git add labs/11-anonymous-access && git commit -m "test(lab-11): tests and reference solution"`

### Task B: Starter, README, metadata

- [ ] **Step 1:** Turn `src/ClubAccess.sol` into the starter, using the Starter section above. Keep every declaration the tests use.
- [ ] **Step 2:** Write `README.md` and `lab.json` as above, then run `node scripts/sync-labs.mjs`.
- [ ] **Step 3: Verify.** `bash scripts/verify-lab.sh labs/11-anonymous-access`. Expected: `PASS labs/11-anonymous-access`.
- [ ] **Step 4: Commit.** `git add -A labs/11-anonymous-access .devcontainer site/src/labs.json && git commit -m "feat(lab-11): Anonymous Club Access lab"`

