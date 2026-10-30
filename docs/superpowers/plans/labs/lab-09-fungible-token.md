# Lab 09: Fungible Token Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Students write a complete ERC-20 token from scratch, without OpenZeppelin, so they understand every line of the standard they'll use for the rest of their careers.

**Architecture:** `labs/09-fungible-token/` built with the Lab Recipe (plan 02). The starter provides `src/IERC20.sol` complete. The student implements `src/CampusToken.sol`.

**Tech Stack:** Foundry, forge-std, Solidity ^0.8.24.

**Spec:** `docs/superpowers/specs/2026-10-29-abc-learning-platform-design.md`. Recipe: plan 02 § Lab Recipe.

**Adapted from:** Solana "learn Solana's token program by minting a fungible token". Mint account, mint authority, token accounts, `mintTo`, `transfer`, and `getMint` supply map to ERC-20 `owner` as mint authority, `balanceOf` (no separate token accounts), `mint`, `transfer`, and `totalSupply`. The README has a short table comparing the two models.

## Global Constraints

- Plan 02 constraints apply.
- Name `"Ashesi Campus Token"`, symbol `"ACT"`, `decimals() == 18`.
- Custom errors in the ERC-6093 style: `ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)`, `ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed)`, `ERC20InvalidReceiver(address)`, `ERC20InvalidSpender(address)`, plus `NotMinter()`.

## Review Focus

1. **Transfer to `address(0)`.** Revert `ERC20InvalidReceiver(address(0))`. Burning is only possible through `burn`. `test_06_NoTransferToZero`.
2. **Infinite allowance (`type(uint256).max`).** It is not decreased by `transferFrom`, matching common practice. `test_09_InfiniteAllowance`.
3. **A zero-value transfer.** Allowed, and it emits `Transfer`, as the standard requires. `test_05b_ZeroTransfer`.
4. **Approve overwrites, it doesn't add.** `test_07b_ApproveOverwrites`.
5. **Supply always equals the sum of balances.** Fuzz test `testFuzz_10_SupplyInvariant(uint96 a, uint96 b)`.

## lab.json

`{ "n": 9, "slug": "fungible-token", "title": "Fungible Token (ERC-20)", "kind": "learn", "summary": "Write the ERC-20 standard from scratch and mint the Ashesi Campus Token.", "concepts": ["interfaces", "ERC-20", "allowances", "events", "fuzz testing"], "adaptedFrom": "Solana: token program, minting a fungible token", "docs": ["m06-contracts/13-abstract-and-interfaces", "m06-contracts/09-events", "m06-contracts/10-custom-errors"], "openFiles": ["README.md", "src/CampusToken.sol", "src/IERC20.sol"] }`

## Interface

`src/IERC20.sol` is the standard 6 functions plus 2 events, given complete. `src/CampusToken.sol`:

```solidity
contract CampusToken is IERC20 {
    error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed);
    error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed);
    error ERC20InvalidReceiver(address receiver);
    error ERC20InvalidSpender(address spender);
    error NotMinter();

    address public immutable minter;
    function name() external pure returns (string memory);
    function symbol() external pure returns (string memory);
    function decimals() external pure returns (uint8);
    // IERC20: totalSupply, balanceOf, transfer, allowance, approve, transferFrom
    function mint(address to, uint256 amount) external;   // minter only; Transfer(0, to, amount)
    function burn(uint256 amount) external;               // Transfer(msg.sender, 0, amount)
}
```

## Tests (`test/CampusToken.t.sol`)

| Test | Asserts |
|---|---|
| `test_01_Metadata` | name, symbol, decimals 18 |
| `test_02_MinterIsDeployer` | `minter()==address(this)` |
| `test_03_Mint` | supply and balance up, `Transfer(0, ama, 100e18)` |
| `test_03b_OnlyMinter` | `NotMinter` |
| `test_04_Burn` | supply down, `Transfer(ama, 0, x)`; over-burn → `ERC20InsufficientBalance` |
| `test_05_Transfer` | balances move, returns true, event |
| `test_05b_ZeroTransfer` | 0 transfer ok and emits |
| `test_06_InsufficientBalance` | exact error args |
| `test_06_NoTransferToZero` | `ERC20InvalidReceiver(address(0))` |
| `test_07_Approve` | allowance set, `Approval`, returns true; `approve(address(0),…)` → `ERC20InvalidSpender` |
| `test_07b_ApproveOverwrites` | approve 50 then 20 → 20 |
| `test_08_TransferFrom` | allowance decreases, balances move |
| `test_08b_InsufficientAllowance` | exact error args |
| `test_09_InfiniteAllowance` | max allowance unchanged after transferFrom |
| `testFuzz_10_SupplyInvariant` | mint a and b to two users, transfer half of a; `totalSupply == balanceOf(x)+balanceOf(y)` |

## Starter

`IERC20.sol` is complete. `CampusToken.sol` has the declarations and `minter = msg.sender` in the constructor. Every function body is a TODO, and functions with a `bool` return have no `return` (the default `false` fails the tests).

## README

Steps 1–10 follow the tests (the fuzz test is step 10, with a paragraph on what fuzzing is). It includes the Solana↔ERC-20 comparison table. **Discuss:** `approve` then `transferFrom` has a known front-running issue when changing a non-zero allowance. How could a spender exploit it?

---

### Task A: Tests and solution

- [ ] **Step 1:** Create `labs/09-fungible-token/foundry.toml` (copied from lab 08) and the test file with every test in the Tests table.
- [ ] **Step 2:** Write the full solution in `src/CampusToken.sol` against the Interface above.
- [ ] **Step 3: Run in a Codespace.** `cd labs/09-fungible-token && forge test`. Expected: `15 passed; 0 failed`.
- [ ] **Step 4:** `mkdir -p .solution/src && cp src/CampusToken.sol .solution/src/`
- [ ] **Step 5: Commit.** `git add labs/09-fungible-token && git commit -m "test(lab-09): tests and reference solution"`

### Task B: Starter, README, metadata

- [ ] **Step 1:** Turn `src/CampusToken.sol` into the starter, using the Starter section above. Keep every declaration the tests use.
- [ ] **Step 2:** Write `README.md` and `lab.json` as above, then run `node scripts/sync-labs.mjs`.
- [ ] **Step 3: Verify.** `bash scripts/verify-lab.sh labs/09-fungible-token`. Expected: `PASS labs/09-fungible-token`.
- [ ] **Step 4: Commit.** `git add -A labs/09-fungible-token .devcontainer site/src/labs.json && git commit -m "feat(lab-09): Fungible Token (ERC-20) lab"`

