# Lab 12: Tic-Tac-Toe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A guided build of on-chain tic-tac-toe for many simultaneous games. It teaches enums, fixed-size 2-D arrays, structs in mappings, storage references, and custom errors.

**Architecture:** `labs/12-tic-tac-toe/` built with the Lab Recipe (plan 02). Thirteen numbered steps (16 tests).

**Tech Stack:** Foundry, forge-std, Solidity ^0.8.24.

**Spec:** `docs/superpowers/specs/2026-10-29-abc-learning-platform-design.md`. Recipe: plan 02 § Lab Recipe.

**Adapted from:** Solana "learn Anchor by building tic-tac-toe" parts 1 and 2. A `Game` account (PDA) becomes `mapping(uint256 => Game)`. `Sign`/`GameState` enums stay. The errors `TileOutOfBounds`, `TileAlreadySet`, `GameAlreadyOver`, and `NotPlayersTurn` keep their names. `setup_game` and `play` become `newGame` and `play`. The Anchor account-size calculation lesson becomes a short note on storage slots.

## Global Constraints

- Plan 02 constraints apply.
- `players[0]` is X and moves first. `turn` counts from 1, and the player to move is `players[(turn - 1) % 2]`.
- `Tile` is `{ uint8 row; uint8 col; }` in the range 0..2.

## Review Focus

1. **The ninth move wins on the last tile.** It must be `Won`, not `Tie`. Check for a win before checking for a tie. `test_12_WinOnLastMove`.
2. **Playing in a game that doesn't exist** (`id >= gameCount`). Revert `GameNotFound`. `test_08b_UnknownGame`.
3. **A player starting a game against themself.** Revert `SamePlayer`. `test_02b_SamePlayer`.
4. **A move after the game ended.** `GameAlreadyOver`. `test_11_NoMovesAfterWin`.
5. **Two games running at once** don't interfere. `test_13_IndependentGames`.

## lab.json

`{ "n": 12, "slug": "tic-tac-toe", "title": "Tic-Tac-Toe", "kind": "learn", "summary": "Run many tic-tac-toe games on-chain with enums, 2-D arrays and storage pointers.", "concepts": ["enum", "fixed 2-D arrays", "struct in mapping", "storage references", "custom errors"], "adaptedFrom": "Solana: Anchor tic-tac-toe parts 1 & 2", "docs": ["m03-types/04-enums-and-udvts", "m03-types/07-arrays-and-slices", "m03-types/06-data-location", "m05-expressions/01-control-structures"], "openFiles": ["README.md", "src/TicTacToe.sol"] }`

## Interface (`src/TicTacToe.sol`)

```solidity
contract TicTacToe {
    enum Sign { Empty, X, O }
    enum State { Active, Won, Tie }
    struct Tile { uint8 row; uint8 col; }
    struct Game { address[2] players; uint8 turn; Sign[3][3] board; State state; address winner; }
    error SamePlayer(); error GameNotFound(); error TileOutOfBounds(); error TileAlreadySet();
    error GameAlreadyOver(); error NotPlayersTurn();
    event GameStarted(uint256 indexed id, address indexed x, address indexed o);
    event Moved(uint256 indexed id, address indexed player, uint8 row, uint8 col);
    event GameOver(uint256 indexed id, State state, address winner);

    uint256 public gameCount;
    mapping(uint256 => Game) internal games;

    function newGame(address opponent) external returns (uint256 id);   // sender is X
    function play(uint256 id, Tile calldata tile) external;
    function board(uint256 id) external view returns (Sign[3][3] memory);
    function currentPlayer(uint256 id) external view returns (address);
    function status(uint256 id) external view returns (State state, address winner);
}
```

## Tests (`test/TicTacToe.t.sol`)

| Test | Asserts |
|---|---|
| `test_01_NoGamesYet` | `gameCount()==0` |
| `test_02_NewGame` | id 0, `GameStarted(0, ama, kofi)`, count 1, `currentPlayer(0)==ama` |
| `test_02b_SamePlayer` | `SamePlayer` |
| `test_03_EmptyBoard` | all 9 tiles `Sign.Empty` |
| `test_04_FirstMove` | ama plays (1,1) → `board[1][1]==X`, `Moved` event, `currentPlayer==kofi` |
| `test_05_OutOfBounds` | (3,0) → `TileOutOfBounds` |
| `test_06_TileTaken` | `TileAlreadySet` |
| `test_07_NotYourTurn` | kofi first → `NotPlayersTurn`; a stranger → `NotPlayersTurn` |
| `test_08_Alternates` | X, O, X signs placed correctly |
| `test_08b_UnknownGame` | `GameNotFound` |
| `test_09_RowWin` | X wins row 0 → `status==(Won, ama)`, `GameOver` |
| `test_10_DiagonalAndColumnWins` | two games: an anti-diagonal win for O and a column win for X |
| `test_11_NoMovesAfterWin` | `GameAlreadyOver` |
| `test_12_WinOnLastMove` | a 9-move sequence where move 9 completes a line → `Won` |
| `test_12b_Tie` | a known 9-move draw → `(Tie, address(0))` |
| `test_13_IndependentGames` | moves in game 0 don't touch game 1 |

## Starter

Declarations are given. Bodies are TODO. The `play` TODO is split into the same sub-steps as the Anchor lesson: bounds → game active → turn → tile empty → place → win check → tie check → turn++. There is a private helper `_isWinner(Sign[3][3] storage b, Sign s) private view returns (bool)` with a TODO body.

## README

Thirteen steps with the Anchor ↔ Solidity mapping table (`#[account]` ↔ struct in mapping, `Context` ↔ `msg.sender`, `require!` ↔ `revert Error()`). **Discuss:** Every move costs gas and is public. What would you change to play rock-paper-scissors instead?

---

### Task A: Tests and solution

- [ ] **Step 1:** Create `labs/12-tic-tac-toe/foundry.toml` (copied from lab 08) and the test file with every test in the Tests table.
- [ ] **Step 2:** Write the full solution in `src/TicTacToe.sol` against the Interface above.
- [ ] **Step 3: Run in a Codespace.** `cd labs/12-tic-tac-toe && forge test`. Expected: `16 passed; 0 failed`.
- [ ] **Step 4:** `mkdir -p .solution/src && cp src/TicTacToe.sol .solution/src/`
- [ ] **Step 5: Commit.** `git add labs/12-tic-tac-toe && git commit -m "test(lab-12): tests and reference solution"`

### Task B: Starter, README, metadata

- [ ] **Step 1:** Turn `src/TicTacToe.sol` into the starter, using the Starter section above. Keep every declaration the tests use.
- [ ] **Step 2:** Write `README.md` and `lab.json` as above, then run `node scripts/sync-labs.mjs`.
- [ ] **Step 3: Verify.** `bash scripts/verify-lab.sh labs/12-tic-tac-toe`. Expected: `PASS labs/12-tic-tac-toe`.
- [ ] **Step 4: Commit.** `git add -A labs/12-tic-tac-toe .devcontainer site/src/labs.json && git commit -m "feat(lab-12): Tic-Tac-Toe lab"`

