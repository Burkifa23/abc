# Lab 08: Secure Campus Elections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grow the existing pilot lab into the full civic election from `Plan.md` Workshop 3: registered voters, one vote per wallet, delegation (as in the docs "Voting" example), and a voting deadline.

**Architecture:** Rewrite `labs/08-campus-elections/` (moved there by plan 02 Task 1) with the Lab Recipe. The old 11 tests are replaced by the user-story tests below.

**Tech Stack:** Foundry, forge-std, Solidity ^0.8.24.

**Spec:** `docs/superpowers/specs/2026-10-29-abc-learning-platform-design.md`. Recipe: plan 02 § Lab Recipe.

**Adapted from:** `Plan.md` Workshop 3 and Solidity docs "Solidity by Example → Voting" (weights, delegation, loop detection).

## Global Constraints

- Plan 02 constraints apply. **Depends on plan 02 Task 1** (lab moved, `.solution/src/` layout).
- Pair programming: the README tells pairs to swap drivers after every user story.

## Review Focus

1. **Delegation loops** (A→B→A). Revert `DelegationLoop`. `test_US5_DelegationLoop`.
2. **Delegating to someone who already voted.** Their candidate gains the weight right away. `test_US5_DelegateToVoter`.
3. **Delegating to an unregistered address.** Revert `NotRegistered`, because the weight would vanish. `test_US5_DelegateToUnregistered`.
4. **A vote at exactly `votingEnds`.** Rejected: voting is open while `block.timestamp < votingEnds`. `test_US6_ClosedAtDeadline`.
5. **Asking for the winner while voting is open.** Revert `VotingOpen`, so an early "winner" can't be quoted. `test_US7_NoWinnerWhileOpen`.

## lab.json

`{ "n": 8, "slug": "campus-elections", "title": "Secure Campus Elections", "kind": "build", "summary": "Stop ballot stuffing: one vote per registered wallet, delegation, and a hard deadline.", "concepts": ["struct", "mapping", "msg.sender", "delegation", "block.timestamp", "custom errors"], "adaptedFrom": "Plan.md Workshop 3 + Solidity docs Voting", "docs": ["m07-by-example/01-voting", "m04-units-and-globals/02-block-and-transaction"], "openFiles": ["README.md", "src/Election.sol"] }`

## Interface (`src/Election.sol`)

```solidity
contract Election {
    struct Candidate { string name; uint256 voteCount; }
    struct Voter { bool registered; bool voted; address delegate; uint256 weight; uint256 vote; }
    error NotAdmin(); error NotRegistered(); error AlreadyVoted(); error InvalidCandidate();
    error SelfDelegation(); error DelegationLoop(); error VotingClosed(); error VotingOpen();
    event Voted(address indexed voter, uint256 indexed candidateId, uint256 weight);
    event Delegated(address indexed from, address indexed to);

    address public immutable admin;
    uint256 public immutable votingEnds;
    Candidate[] public candidates;
    mapping(address => Voter) public voters;

    constructor(string[] memory candidateNames, uint256 votingPeriod); // votingEnds = block.timestamp + votingPeriod
    function candidateCount() external view returns (uint256);
    function registerVoter(address voter) external;     // admin; weight = 1
    function delegate(address to) external;             // follows the chain like the docs example
    function vote(uint256 candidateId) external;        // adds sender's weight
    function winner() external view returns (string memory); // VotingOpen before votingEnds; ties → lower id
}
```

## User stories → tests (setUp: candidates Ama, Kofi, Esi; period 1 days)

| # | Story | Tests |
|---|---|---|
| US1 | The admin creates the election with candidates and a deadline | `test_US1_Setup` (admin, 3 candidates, `votingEnds == block.timestamp + 1 days`) |
| US2 | Only the admin registers voters, with weight 1 | `test_US2_Register`, `test_US2_OnlyAdmin` |
| US3 | Only registered voters vote, once, for a real candidate | `test_US3_Unregistered`, `test_US3_Twice`, `test_US3_InvalidCandidate` |
| US4 | A vote adds the voter's weight and is logged | `test_US4_VoteCounted` (`Voted(ama, 2, 1)`) |
| US5 | A voter can delegate instead of voting | `test_US5_DelegateAddsWeight` (bob→ama, ama votes weight 2), `test_US5_DelegateToVoter`, `test_US5_SelfDelegation`, `test_US5_DelegationLoop`, `test_US5_DelegateToUnregistered`, `test_US5_CannotVoteAfterDelegating` |
| US6 | No voting after the deadline | `test_US6_ClosedAtDeadline` (`vm.warp(votingEnds)` → `VotingClosed`, for vote and delegate) |
| US7 | The winner is known only after the deadline | `test_US7_NoWinnerWhileOpen`, `test_US7_Winner`, `test_US7_TieLowerId` |

## Starter

Like today's starter: declarations kept, bodies TODO. `delegate` has a 5-line TODO walking through the docs algorithm (follow `to` while its delegate isn't zero, loop check, mark voted, then add weight to the delegate or its vote).

## README

Keep the current problem statement and the "Discuss" on admin power. Add a second Discuss question: "Delegation chains cost gas per hop. What could an attacker do with a 10,000-long chain?" (docs warning on loops)

---

### Task A: Tests and solution

- [ ] **Step 1:** Create `labs/08-campus-elections/foundry.toml` (copied from lab 08) and the test file with every test in the Tests table.
- [ ] **Step 2:** Write the full solution in `src/Election.sol` against the Interface above.
- [ ] **Step 3: Run in a Codespace.** `cd labs/08-campus-elections && forge test`. Expected: `17 passed; 0 failed`.
- [ ] **Step 4:** `mkdir -p .solution/src && cp src/Election.sol .solution/src/`
- [ ] **Step 5: Commit.** `git add labs/08-campus-elections && git commit -m "test(lab-08): tests and reference solution"`

### Task B: Starter, README, metadata

- [ ] **Step 1:** Turn `src/Election.sol` into the starter, using the Starter section above. Keep every declaration the tests use.
- [ ] **Step 2:** Write `README.md` and `lab.json` as above, then run `node scripts/sync-labs.mjs`.
- [ ] **Step 3: Verify.** `bash scripts/verify-lab.sh labs/08-campus-elections`. Expected: `PASS labs/08-campus-elections`.
- [ ] **Step 4: Commit.** `git add -A labs/08-campus-elections .devcontainer site/src/labs.json && git commit -m "feat(lab-08): Secure Campus Elections lab"`

