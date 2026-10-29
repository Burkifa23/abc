# Lab 06: Word Guess Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A guessing game that teaches access control, hashing, and the most important privacy lesson in Solidity: `private` does not mean secret.

**Architecture:** `labs/06-word-guess/` built with the Lab Recipe (plan 02). One step uses `vm.load` to read a "private" variable straight out of storage.

**Tech Stack:** Foundry, forge-std, Solidity ^0.8.24.

**Spec:** `docs/superpowers/specs/2026-10-29-abc-learning-platform-design.md`. Recipe: plan 02 § Lab Recipe.

**Adapted from:** NEAR "learn NEAR smart contracts by building a word guessing game". `@NearBindgen` becomes a contract. `privateFunction: true` becomes an `onlyOwner` modifier. `near.predecessorAccountId()` becomes `msg.sender`. The secret word stored in plain text becomes a stored hash, after first showing that the plain-text version leaks.

## Global Constraints

- Plan 02 constraints apply.
- Word comparison is case-sensitive: `keccak256(bytes(guess)) == secretHash`.

## Review Focus

1. **Reading the secret from storage.** `test_04_PrivateIsNotSecret` reads slot 0 (`naiveSecret`) with `vm.load` and decodes "akwaaba". The README explains why.
2. **A guess before any secret is set.** Revert `NoSecret`. `test_06b_NoSecret`.
3. **A new round.** `setSecret` again clears the winner list and the hints for the new round. `test_09_NewRoundResets`.
4. **A non-owner adds a hint.** `NotOwner`. `test_05b_OnlyOwnerHints`.

## lab.json

`{ "n": 6, "slug": "word-guess", "title": "Word Guess", "kind": "learn", "summary": "Build a guessing game and learn why private data on-chain is never secret.", "concepts": ["modifier", "onlyOwner", "keccak256", "private vs secret", "storage slots", "events"], "adaptedFrom": "NEAR: word guessing game", "docs": ["m06-contracts/03-function-modifiers", "m08-security/01-private-data-and-randomness", "m09-under-the-hood/03-storage-layout"], "openFiles": ["README.md", "src/WordGuess.sol"] }`

## Interface (`src/WordGuess.sol`)

```solidity
contract WordGuess {
    error NotOwner();
    error NoSecret();
    event SecretSet(uint256 indexed round, bytes32 secretHash);
    event HintAdded(uint256 indexed round, string hint);
    event Guessed(uint256 indexed round, address indexed guesser, string guess, bool correct);

    address public immutable owner;        // not stored in a slot (immutable)
    string private naiveSecret;            // slot 0 — the "wrong way", set by setNaiveSecret
    bytes32 public secretHash;             // slot 1
    uint256 public round;                  // slot 2
    string[] internal hints;
    address[] internal winners;

    modifier onlyOwner();
    constructor();
    function setNaiveSecret(string calldata word) external onlyOwner;   // demo of the leak
    function hashWord(string calldata word) public pure returns (bytes32);
    function setSecret(bytes32 hash) external onlyOwner;   // round++, clears hints and winners
    function addHint(string calldata hint) external onlyOwner;
    function viewHints() external view returns (string[] memory);
    function makeGuess(string calldata guess) external returns (bool correct); // NoSecret if hash == 0
    function viewWinners() external view returns (address[] memory);
}
```

Storage layout for `test_04`: `owner` is immutable and takes no slot, so `naiveSecret` is **slot 0**. A short string (≤ 31 bytes) is stored in place, with `length*2` in the lowest byte. The test decodes it.

## Tests (`test/WordGuess.t.sol`)

| Test | Asserts |
|---|---|
| `test_01_DeployerIsOwner` | `owner()==address(this)` |
| `test_02_OnlyOwnerModifier` | non-owner `setSecret` → `NotOwner` |
| `test_03_HashWord` | `hashWord("akwaaba")==keccak256(bytes("akwaaba"))` |
| `test_04_PrivateIsNotSecret` | after `setNaiveSecret("akwaaba")`, `vm.load(address(g), bytes32(0))` decodes to `"akwaaba"` |
| `test_05_AddsHints` | two hints; `viewHints()` returns both; `HintAdded` |
| `test_05b_OnlyOwnerHints` | non-owner → `NotOwner` |
| `test_06_WrongGuess` | `makeGuess("hello")` returns false, emits `Guessed(…, false)`, no winner |
| `test_06b_NoSecret` | guess before `setSecret` → `NoSecret` |
| `test_07_RightGuess` | returns true; `viewWinners()==[kofi]` |
| `test_08_CaseSensitive` | "Akwaaba" is wrong |
| `test_09_NewRoundResets` | second `setSecret` → `round()==2`, hints and winners empty |

## Starter

`owner` is set in the constructor, as in lab 01. The TODOs are: the modifier body (1), `setNaiveSecret` (2), `hashWord` (3), `setSecret` (4), `addHint`/`viewHints` (5), `makeGuess` (6), `viewWinners` (7).

## README

The steps follow the tests. Step 4 is a "spy" step where the student runs the test and then reads the explanation of slots. **Discuss:** Every guess is a public transaction. How could someone copy a correct guess before it is mined? (front-running → commit-reveal in labs 11 and 16)

---

### Task A: Tests and solution

- [ ] **Step 1:** Create `labs/06-word-guess/foundry.toml` (copied from lab 08) and the test file with every test in the Tests table.
- [ ] **Step 2:** Write the full solution in `src/WordGuess.sol` against the Interface above.
- [ ] **Step 3: Run in a Codespace.** `cd labs/06-word-guess && forge test`. Expected: `11 passed; 0 failed`.
- [ ] **Step 4:** `mkdir -p .solution/src && cp src/WordGuess.sol .solution/src/`
- [ ] **Step 5: Commit.** `git add labs/06-word-guess && git commit -m "test(lab-06): tests and reference solution"`

### Task B: Starter, README, metadata

- [ ] **Step 1:** Turn `src/WordGuess.sol` into the starter, using the Starter section above. Keep every declaration the tests use.
- [ ] **Step 2:** Write `README.md` and `lab.json` as above, then run `node scripts/sync-labs.mjs`.
- [ ] **Step 3: Verify.** `bash scripts/verify-lab.sh labs/06-word-guess`. Expected: `PASS labs/06-word-guess`.
- [ ] **Step 4: Commit.** `git add -A labs/06-word-guess .devcontainer site/src/labs.json && git commit -m "feat(lab-06): Word Guess lab"`

