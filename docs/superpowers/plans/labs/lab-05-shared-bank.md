# Lab 05: Shared Bank Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Students handle real ether for the first time: deposits, internal transfers, and safe withdrawals. They watch a reentrancy attack fail against their checks-effects-interactions (CEI) ordering.

**Architecture:** `labs/05-shared-bank/` built with the Lab Recipe (plan 02). It includes an attacker contract in the test file.

**Tech Stack:** Foundry, forge-std, Solidity ^0.8.24.

**Spec:** `docs/superpowers/specs/2026-10-29-abc-learning-platform-design.md`. Recipe: plan 02 § Lab Recipe.

**Adapted from:** `Plan.md` Workshop 2 ("Shared Bank": `uint`, `mapping`, state) and the docs "Subcurrency" example. The Remix version in Workshop 2 stays as an in-class warm-up. This lab is the tested version.

## Global Constraints

- Plan 02 constraints apply.
- Withdrawals use `(bool ok, ) = payable(msg.sender).call{value: amount}("")` and revert `TransferFailed()` if `!ok`. Never use `transfer` or `send`.
- Strict CEI order in `withdraw`: check, update the balance, then call.

## Review Focus

1. **Reentrancy:** an attacker re-entering `withdraw` from `receive` must not get more than its balance. `test_08_ReentrancyFails`.
2. **Zero-amount deposit or withdraw.** Revert `ZeroAmount`. `test_02b_ZeroDeposit`, `test_05b_ZeroWithdraw`.
3. **Plain ether sent with no calldata** (`receive`). Credited like a deposit. `test_03_ReceiveCredits`.
4. **A transfer to yourself.** Allowed, and the balance is unchanged. `test_06b_SelfTransfer`.
5. **The contract's ether balance always equals `totalDeposits`.** Asserted at the end of tests 02–08 via `_assertSolvent()`.

## lab.json

`{ "n": 5, "slug": "shared-bank", "title": "Shared Bank", "kind": "learn", "summary": "Hold real ether safely: deposit, transfer, withdraw, and survive a reentrancy attack.", "concepts": ["payable", "msg.value", "receive", "call{value:}", "checks-effects-interactions", "reentrancy"], "adaptedFrom": "Plan.md Workshop 2 + Solidity docs Subcurrency", "docs": ["m01-smart-contracts/03-subcurrency", "m04-units-and-globals/02-block-and-transaction", "m08-security/02-reentrancy", "m08-security/06-withdrawal-pattern"], "openFiles": ["README.md", "src/SharedBank.sol"] }`

## Interface (`src/SharedBank.sol`)

```solidity
contract SharedBank {
    error ZeroAmount();
    error InsufficientBalance(uint256 requested, uint256 available);
    error TransferFailed();
    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);
    event Transferred(address indexed from, address indexed to, uint256 amount);

    mapping(address => uint256) public balanceOf;
    uint256 public totalDeposits;

    function deposit() public payable;
    receive() external payable;            // calls deposit logic
    function transfer(address to, uint256 amount) external;
    function withdraw(uint256 amount) external;
}
```

## Tests (`test/SharedBank.t.sol`)

Uses `vm.deal`. The test file defines `contract Attacker { receive() external payable { if (address(bank).balance >= 1 ether) bank.withdraw(1 ether); } function attack() … }`.

| Test | Asserts |
|---|---|
| `test_01_StartsEmpty` | `totalDeposits()==0`, `balanceOf(ama)==0` |
| `test_02_Deposit` | ama deposits 1 ether → balance, total, `Deposited` |
| `test_02b_ZeroDeposit` | `deposit{value:0}` → `ZeroAmount` |
| `test_03_ReceiveCredits` | `payable(bank).call{value: 1 ether}("")` credits ama |
| `test_04_Withdraw` | withdraw 0.4 ether: ama's wallet +0.4, balance 0.6, `Withdrawn` |
| `test_05_WithdrawTooMuch` | `InsufficientBalance(2 ether, 1 ether)` |
| `test_05b_ZeroWithdraw` | `ZeroAmount` |
| `test_06_InternalTransfer` | ama→kofi 0.3 ether, no ether moves (`address(bank).balance` unchanged), `Transferred` |
| `test_06b_SelfTransfer` | ama→ama leaves balance unchanged |
| `test_07_TransferTooMuch` | `InsufficientBalance` |
| `test_08_ReentrancyFails` | others deposit 10 ether, the attacker deposits 1 and attacks → `expectRevert(TransferFailed.selector)`, bank still holds 11 ether |

## Starter

Bodies are TODOs. `withdraw`'s TODO lists the three CEI phases as numbered sub-steps. Put a `// ⚠ order matters, see test_08` comment above it.

## README

Steps follow the tests. Before step 8, "Break it on purpose": move the balance update below the `.call`, run `test_08`, and watch the attacker drain the bank. Then restore the order. **Discuss:** Why does ABC's procurement lab (16) use "withdraw" instead of paying winners directly?

---

### Task A: Tests and solution

- [ ] **Step 1:** Create `labs/05-shared-bank/foundry.toml` (copied from lab 08) and the test file with every test in the Tests table.
- [ ] **Step 2:** Write the full solution in `src/SharedBank.sol` against the Interface above.
- [ ] **Step 3: Run in a Codespace.** `cd labs/05-shared-bank && forge test`. Expected: `11 passed; 0 failed`.
- [ ] **Step 4:** `mkdir -p .solution/src && cp src/SharedBank.sol .solution/src/`
- [ ] **Step 5: Commit.** `git add labs/05-shared-bank && git commit -m "test(lab-05): tests and reference solution"`

### Task B: Starter, README, metadata

- [ ] **Step 1:** Turn `src/SharedBank.sol` into the starter, using the Starter section above. Keep every declaration the tests use.
- [ ] **Step 2:** Write `README.md` and `lab.json` as above, then run `node scripts/sync-labs.mjs`.
- [ ] **Step 3: Verify.** `bash scripts/verify-lab.sh labs/05-shared-bank`. Expected: `PASS labs/05-shared-bank`.
- [ ] **Step 4: Commit.** `git add -A labs/05-shared-bank .devcontainer site/src/labs.json && git commit -m "feat(lab-05): Shared Bank lab"`

