# Lab 10: Fundraising Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A build project. Students write a crowdfunding contract: reach the goal before the deadline or everyone gets refunded, with pull payments throughout.

**Architecture:** `labs/10-fundraising/` built with the Lab Recipe (plan 02). It is a state machine (`Open → Succeeded | Failed`).

**Tech Stack:** Foundry, forge-std, Solidity ^0.8.24.

**Spec:** `docs/superpowers/specs/2026-10-29-abc-learning-platform-design.md`. Recipe: plan 02 § Lab Recipe.

**Adapted from:** freeCodeCamp web3 "build a fundraising smart contract". The goal of 150 tokens before the seventh block becomes a `goal` (wei) before a `deadline` (timestamp). The contract pays the creator, or refunds donors. `status` open/closed becomes a `Status` enum. `get-description` and `update-description` stay. The bonus "destroy the contract" becomes `cancel()`. Automatic payouts become pull payments (`claim`, `refund`), because pushing ether in a loop is a docs-listed pitfall.

## Global Constraints

- Plan 02 constraints apply.
- Donations are accepted while `status == Open && block.timestamp < deadline`.
- When a donation makes `raised >= goal`, the status becomes `Succeeded` right away and `GoalReached` is emitted. Later donations revert `NotOpen`.

## Review Focus

1. **A donation that overshoots the goal.** It is accepted in full, with no partial refund. `test_US3_Overshoot`.
2. **Refunding twice.** The second refund reverts `NothingToRefund`, because the contribution is zeroed before sending. `test_US6_RefundOnce`.
3. **`finalize` called before the deadline.** Revert `TooEarly`. `test_US5_FinalizeTooEarly`.
4. **`claim` by a non-creator, or before success.** `NotCreator` or `NotSucceeded`. `test_US4_ClaimGuards`.
5. **The creator cancels after success.** Revert `NotOpen`, so creators can't run off with funds and then refund nobody. `test_US7_NoCancelAfterSuccess`.

## lab.json

`{ "n": 10, "slug": "fundraising", "title": "Fundraising", "kind": "build", "summary": "Raise money for a campus startup: hit the goal before the deadline or refund everyone.", "concepts": ["enum state machine", "payable", "block.timestamp", "pull payments", "modifiers"], "adaptedFrom": "freeCodeCamp web3: build a fundraising smart contract", "docs": ["m08-security/06-withdrawal-pattern", "m08-security/08-state-machine", "m04-units-and-globals/01-ether-and-time-units"], "openFiles": ["README.md", "src/Fundraiser.sol"] }`

## Interface (`src/Fundraiser.sol`)

```solidity
contract Fundraiser {
    enum Status { Open, Succeeded, Failed }
    error NotCreator(); error NotOpen(); error ZeroDonation(); error TooEarly();
    error NotSucceeded(); error NotFailed(); error NothingToRefund(); error TransferFailed();
    event Donated(address indexed donor, uint256 amount, uint256 raised);
    event GoalReached(uint256 raised);
    event Claimed(uint256 amount);
    event Refunded(address indexed donor, uint256 amount);
    event DescriptionUpdated(string description);

    address public immutable creator;
    uint256 public immutable goal;
    uint256 public immutable deadline;
    string public description;
    Status public status;
    uint256 public raised;
    mapping(address => uint256) public contributions;

    constructor(uint256 goal_, uint256 duration, string memory description_);
    function updateDescription(string calldata d) external;   // creator only
    function donate() external payable;
    function finalize() external;   // anyone; after deadline, if still Open → Failed
    function claim() external;      // creator; Succeeded; sends whole balance once (raised stays for history)
    function refund() external;     // Failed; sends sender's contribution
    function cancel() external;     // creator; Open → Failed (bonus story)
}
```

## User stories → tests (goal 150 ether, duration 7 days, description "Smart contract")

| # | Story | Tests |
|---|---|---|
| US1 | Starts open with a description | `test_US1_Initial` |
| US2 | The creator can change the description | `test_US2_UpdateDescription` (to "Smart contract to raise funds for my start up."), `test_US2_OnlyCreator` |
| US3 | Anyone donates while open | `test_US3_Donate` (event, contributions, raised), `test_US3_Zero`, `test_US3_Overshoot`, `test_US3_AfterDeadline` (`NotOpen`) |
| US4 | Reaching the goal lets the creator claim everything | `test_US4_GoalReached` (status, event), `test_US4_Claim` (creator +150 ether), `test_US4_ClaimGuards` |
| US5 | After the deadline without the goal, it fails | `test_US5_Finalize`, `test_US5_FinalizeTooEarly` |
| US6 | Donors get refunds when it fails | `test_US6_Refund`, `test_US6_RefundOnce`, `test_US6_NoRefundWhenSucceeded` |
| US7 | The creator can cancel while open | `test_US7_Cancel` (then refunds work), `test_US7_NoCancelAfterSuccess` |

## Starter

Declarations, the constructor (sets immutables), and an empty `modifier onlyCreator() { _; }` with a TODO to fill. All other bodies are TODO.

## README

The freeCodeCamp story ("raise funds for my start up"), the user stories, and a note on why this version uses pull payments. **Discuss:** The original paid donors back automatically. With 5,000 donors, what goes wrong?

---

### Task A: Tests and solution

- [ ] **Step 1:** Create `labs/10-fundraising/foundry.toml` (copied from lab 08) and the test file with every test in the Tests table.
- [ ] **Step 2:** Write the full solution in `src/Fundraiser.sol` against the Interface above.
- [ ] **Step 3: Run in a Codespace.** `cd labs/10-fundraising && forge test`. Expected: `17 passed; 0 failed`.
- [ ] **Step 4:** `mkdir -p .solution/src && cp src/Fundraiser.sol .solution/src/`
- [ ] **Step 5: Commit.** `git add labs/10-fundraising && git commit -m "test(lab-10): tests and reference solution"`

### Task B: Starter, README, metadata

- [ ] **Step 1:** Turn `src/Fundraiser.sol` into the starter, using the Starter section above. Keep every declaration the tests use.
- [ ] **Step 2:** Write `README.md` and `lab.json` as above, then run `node scripts/sync-labs.mjs`.
- [ ] **Step 3: Verify.** `bash scripts/verify-lab.sh labs/10-fundraising`. Expected: `PASS labs/10-fundraising`.
- [ ] **Step 4: Commit.** `git add -A labs/10-fundraising .devcontainer site/src/labs.json && git commit -m "feat(lab-10): Fundraising lab"`

