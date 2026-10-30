# Lab 01: Hello Foundry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A first Codespaces lab where a student runs `forge`, reads a failing test, and writes their first contract: a greeting that only its owner can change.

**Architecture:** One lab folder `labs/01-hello-foundry/` built with the Lab Recipe (plan 02). Seven numbered steps, each with one `test_0N_*` test.

**Tech Stack:** Foundry, forge-std, Solidity ^0.8.24.

**Spec:** `docs/superpowers/specs/2026-10-29-abc-learning-platform-design.md`. Recipe: `docs/superpowers/plans/2026-10-29-02-lab-infrastructure.md` § Lab Recipe.

**Adapted from:** Solana "learn how to set up Solana by building a hello world smart contract" and NEAR "learn how to set up NEAR by building a hello world smart contract". The setup steps (keypairs, validator, CLI) become Foundry commands. The contract becomes a greeting store.

## Global Constraints

- Everything in plan 02 Global Constraints applies.
- Use plain words. This is the student's first Solidity file. Every TODO comment says *what* to do and names the keyword to use.

## Review Focus

1. **A student who runs `forge test` from the repo root instead of the lab folder.** The Codespace opens in the lab folder, but the README's first step says `pwd` should end in `labs/01-hello-foundry`.
2. **An empty greeting sets the contract into a useless state.** `test_07_RejectsEmptyGreeting`.
3. **A non-owner changes the greeting.** `test_04_OnlyOwnerCanSet`.

## lab.json

`{ "n": 1, "slug": "hello-foundry", "title": "Hello Foundry", "kind": "learn", "summary": "Run your first tests and write a contract that greets the campus.", "concepts": ["contract", "state variable", "constructor", "view", "event", "custom error"], "adaptedFrom": "Solana & NEAR hello-world setup projects", "docs": ["m01-smart-contracts/02-simple-storage", "m02-source-and-structure/04-anatomy-of-a-contract"], "openFiles": ["README.md", "src/HelloWorld.sol"] }`

## Interface (`src/HelloWorld.sol`)

```solidity
contract HelloWorld {
    error NotOwner();
    error EmptyGreeting();
    event GreetingChanged(address indexed by, string greeting);

    string public greeting;
    address public immutable owner;

    constructor(string memory initial);
    function setGreeting(string calldata newGreeting) external;       // owner only, non-empty
    function greet(string calldata name) external view returns (string memory); // "<greeting>, <name>!"
}
```

## Tests (`test/HelloWorld.t.sol`, setUp deploys `new HelloWorld("Akwaaba")`)

| Test | Asserts |
|---|---|
| `test_01_StoresInitialGreeting` | `greeting() == "Akwaaba"` |
| `test_02_DeployerIsOwner` | `owner() == address(this)` |
| `test_03_OwnerCanSetGreeting` | after `setGreeting("Hello")`, `greeting() == "Hello"` |
| `test_04_OnlyOwnerCanSet` | `vm.prank(makeAddr("kofi"))` then `expectRevert(NotOwner.selector)` |
| `test_05_EmitsGreetingChanged` | `expectEmit(true,false,false,true)`, then `GreetingChanged(address(this), "Hello")` |
| `test_06_GreetsByName` | `greet("Ama") == "Akwaaba, Ama!"` |
| `test_07_RejectsEmptyGreeting` | `setGreeting("")` reverts `EmptyGreeting` |

## Starter TODOs

1. TODO 1 (constructor): save `initial` in `greeting`.
2. TODO 2 (constructor): save `msg.sender` in `owner`.
3. TODO 3 (setGreeting): `if (msg.sender != owner) revert NotOwner();`
4. TODO 4 (setGreeting): revert `EmptyGreeting` when `bytes(newGreeting).length == 0`.
5. TODO 5 (setGreeting): update `greeting` and `emit GreetingChanged(msg.sender, newGreeting)`.
6. TODO 6 (greet): return `string.concat(greeting, ", ", name, "!")`.

`immutable owner` must be assigned in the constructor or the starter won't compile, so the starter keeps `owner = msg.sender;` and TODO 2 becomes a "read this line" note. `test_02` therefore passes from the start, which is fine because `verify-lab.sh` only needs *some* test to fail.

## README

- **Step 0:** `pwd`, `forge --version`, `forge build`, `forge test`. Explain that the PASS/FAIL list is your to-do list.
- **Steps 1–7:** one paragraph each, mapped to the tests above, plus `forge test --mt test_0N`.
- **Bonus:** `anvil` in one terminal; in another, `forge create src/HelloWorld.sol:HelloWorld --rpc-url http://127.0.0.1:8545 --private-key <anvil key 0> --broadcast --constructor-args "Akwaaba"`, then `cast call <addr> "greet(string)(string)" "Ama"`. Say clearly that anvil keys are public test keys.
- **Discuss:** Why is `owner` `immutable` and not a normal state variable?

---

### Task A: Tests and solution

- [ ] **Step 1:** Create `labs/01-hello-foundry/foundry.toml` (copied from lab 08) and `test/HelloWorld.t.sol` with the 7 tests above.
- [ ] **Step 2:** Write the full `src/HelloWorld.sol`.
- [ ] **Step 3: Run in a Codespace.** `cd labs/01-hello-foundry && forge test`. Expected: `7 passed; 0 failed`.
- [ ] **Step 4:** `mkdir -p .solution/src && cp src/HelloWorld.sol .solution/src/`
- [ ] **Step 5: Commit.** `git add labs/01-hello-foundry && git commit -m "test(lab-01): tests and reference solution"`

### Task B: Starter, README, metadata

- [ ] **Step 1:** Replace the bodies with the TODOs above.
- [ ] **Step 2:** Write `README.md` and `lab.json` as above, then run `node scripts/sync-labs.mjs`.
- [ ] **Step 3: Verify.** `bash scripts/verify-lab.sh labs/01-hello-foundry`. Expected: `PASS labs/01-hello-foundry`.
- [ ] **Step 4: Commit.** `git add -A labs/01-hello-foundry .devcontainer site/src/labs.json && git commit -m "feat(lab-01): Hello Foundry lab"`
