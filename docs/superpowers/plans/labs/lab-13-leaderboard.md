# Lab 13: Leaderboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A build project. Students write the paid leaderboard for an on-chain game ("Rock Destroyer"): an entry fee, a trusted score reporter, and a sorted top-5.

**Architecture:** `labs/13-leaderboard/` built with the Lab Recipe (plan 02). The leaderboard is a bounded, sorted array, so gas cost is fixed.

**Tech Stack:** Foundry, forge-std, Solidity ^0.8.24.

**Spec:** `docs/superpowers/specs/2026-10-29-abc-learning-platform-design.md`. Recipe: plan 02 § Lab Recipe.

**Adapted from:** Solana "build an Anchor leaderboard". `initialize_leaderboard` becomes the constructor. `new_game` (transfer 1 SOL to `game_owner`, push `Player{username, pubkey, score: 0, has_payed: true}`) becomes `newGame(string)` with `ENTRY_FEE = 0.01 ether`. `add_player_to_leaderboard` becomes `submitScore`. Space for 5 players becomes `MAX_LEADERS = 5`. The fee goes to the owner's pull balance (`withdrawFees`), not a direct transfer.

## Global Constraints

- Plan 02 constraints apply.
- Only the game owner (the game server) submits scores. The README discusses this trust choice.
- The leaderboard is sorted by score, highest first. A tie keeps the earlier entry ahead. Each address appears at most once and keeps its best score.

## Review Focus

1. **A player already on the board submits a better score.** Their row is updated and re-sorted, not duplicated. `test_US5_BestScoreOnly`.
2. **A lower score from a player on a full board.** No change. `test_US5_LowScoreIgnored`.
3. **Wrong fee (too little or too much).** `WrongFee(sent, required)`. `test_US2_WrongFee`.
4. **Username length:** empty or longer than 32 bytes reverts `BadUsername`. `test_US2_BadUsername`.
5. **A score submitted for a player with no paid game.** `NotPlaying`, and `hasPaid` resets after each submit. `test_US4_MustPay`.

## lab.json

`{ "n": 13, "slug": "leaderboard", "title": "Game Leaderboard", "kind": "build", "summary": "Charge an entry fee, record scores from the game server and keep a sorted top-5.", "concepts": ["payable", "bounded arrays", "sorting in storage", "access control", "pull payments"], "adaptedFrom": "Solana: build an Anchor leaderboard", "docs": ["m03-types/07-arrays-and-slices", "m08-security/03-ether-and-gas-pitfalls", "m08-security/07-restricting-access"], "openFiles": ["README.md", "src/Leaderboard.sol"] }`

## Interface (`src/Leaderboard.sol`)

```solidity
contract Leaderboard {
    struct Player { string username; address addr; uint256 score; }
    error NotGameOwner(); error WrongFee(uint256 sent, uint256 required); error BadUsername();
    error AlreadyPlaying(); error NotPlaying(); error NothingToWithdraw(); error TransferFailed();
    event GameStarted(address indexed player, string username);
    event ScoreSubmitted(address indexed player, uint256 score, uint256 rank); // rank 0 = not on board, else 1..5
    event FeesWithdrawn(uint256 amount);

    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint256 public constant MAX_LEADERS = 5;
    address public immutable gameOwner;
    uint256 public feesOwed;
    mapping(address => bool) public hasPaid;
    mapping(address => string) public usernameOf;

    function newGame(string calldata username) external payable;
    function submitScore(address player, uint256 score) external;   // gameOwner only
    function leaderboard() external view returns (Player[] memory);   // length <= 5, sorted desc
    function withdrawFees() external;                                 // gameOwner
}
```

## User stories → tests

| # | Story | Tests |
|---|---|---|
| US1 | The board starts empty and the deployer is the game owner | `test_US1_Init` |
| US2 | A player pays exactly 0.01 ether to start a game | `test_US2_NewGame` (event, `hasPaid`, `feesOwed`), `test_US2_WrongFee`, `test_US2_BadUsername`, `test_US2_AlreadyPlaying` |
| US3 | Only the game owner submits scores | `test_US3_OnlyOwner` |
| US4 | Submitting ends the paid game | `test_US4_Submit` (`hasPaid` false), `test_US4_MustPay` |
| US5 | The top 5 are kept sorted, one row per player | `test_US5_Sorted` (7 players → top 5 desc), `test_US5_TieKeepsEarlier`, `test_US5_BestScoreOnly`, `test_US5_LowScoreIgnored`, `test_US5_RankInEvent` |
| US6 | The owner withdraws fees with a pull payment | `test_US6_Withdraw`, `test_US6_NothingToWithdraw` |

## Starter

Declarations are given. Storage for the board is the student's choice: the README hints at `Player[] internal board`. Bodies are TODO, and so is the private `_insert` helper.

## README

The Rock Destroyer story, the user stories, and an Anchor ↔ Solidity table (PDA seeds ↔ mapping keys, `has_payed` ↔ `hasPaid`). **Discuss:** The server reports scores. How could the game prove a score without trusting the server? (signatures from lab 03, or replaying moves on-chain)

---

### Task A: Tests and solution

- [ ] **Step 1:** Create `labs/13-leaderboard/foundry.toml` (copied from lab 08) and the test file with every test in the Tests table.
- [ ] **Step 2:** Write the full solution in `src/Leaderboard.sol` against the Interface above.
- [ ] **Step 3: Run in a Codespace.** `cd labs/13-leaderboard && forge test`. Expected: `15 passed; 0 failed`.
- [ ] **Step 4:** `mkdir -p .solution/src && cp src/Leaderboard.sol .solution/src/`
- [ ] **Step 5: Commit.** `git add labs/13-leaderboard && git commit -m "test(lab-13): tests and reference solution"`

### Task B: Starter, README, metadata

- [ ] **Step 1:** Turn `src/Leaderboard.sol` into the starter, using the Starter section above. Keep every declaration the tests use.
- [ ] **Step 2:** Write `README.md` and `lab.json` as above, then run `node scripts/sync-labs.mjs`.
- [ ] **Step 3: Verify.** `bash scripts/verify-lab.sh labs/13-leaderboard`. Expected: `PASS labs/13-leaderboard`.
- [ ] **Step 4: Commit.** `git add -A labs/13-leaderboard .devcontainer site/src/labs.json && git commit -m "feat(lab-13): Game Leaderboard lab"`

