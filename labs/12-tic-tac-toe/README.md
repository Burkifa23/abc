# Lab 12: Tic-Tac-Toe

**The problem:** two students want to play tic-tac-toe where nobody can cheat, and the contract should host many games at once.
**Your job:** implement `src/TicTacToe.sol` step by step. Player 1 is X and moves first.

## Steps

Run `forge test`: every test fails at first. Each test name, such as `test_07_...`, matches a step and a TODO number in the file.

1. **No games yet.** `gameCount` starts at 0. `forge test --mt test_01`
2. **Start a game** (TODO 1 and 2). `newGame(opponent)` returns the new id, stores the two players in a `Game` inside the `games` mapping, and emits `GameStarted`. Playing yourself reverts `SamePlayer()`. Tip: `Game storage g = games[id];` is a pointer into storage; changes through `g` are saved. `forge test --mt test_02`
3. **Read the board** (TODO 3). `board`, `currentPlayer` and `status` read a game. Unknown ids revert `GameNotFound()`. `forge test --mt test_03`
4. **Make a first move** (TODO 4). `play(id, Tile(row, col))` places X on odd turns and O on even turns and emits `Moved`. `forge test --mt test_04`
5. **Stay on the board** (TODO 5). Rows and columns are 0 to 2, otherwise `TileOutOfBounds()`. `forge test --mt test_05`
6. **Do not overwrite** (TODO 6). A taken tile reverts `TileAlreadySet()`. `forge test --mt test_06`
7. **Take turns** (TODO 7). Only `players[(turn - 1) % 2]` may move, otherwise `NotPlayersTurn()`. `forge test --mt test_07`
8. **Alternate, and unknown games** (TODO 8). Check that X, O, X are placed correctly, and that playing in a game that does not exist reverts `GameNotFound()`. `forge test --mt test_08`
9. **Detect a row win** (TODO 9). After placing, if the mover has a line, set the state to `Won`, record the winner and emit `GameOver`. `forge test --mt test_09`
10. **Detect columns and diagonals** (TODO 10). Finish the private helper `_isWinner`. `forge test --mt test_10`
11. **No moves after the end** (TODO 11). A finished game reverts `GameAlreadyOver()`. `forge test --mt test_11`
12. **Wins and ties on the last move** (TODO 12). If the ninth move completes a line, it is a win, not a tie. So check for a win first, then for a tie (`turn == 9`). `forge test --mt test_12`
13. **Independent games** (TODO 13). Increase `turn` otherwise. Two games at once must not touch each other. `forge test --mt test_13`

You're done when you see `16 passed; 0 failed`.

```bash
forge test               # run all tests
forge test --mt test_09  # run one step
forge test -vvv          # show why a test failed
```

## Anchor to Solidity

| Solana (Anchor) | Solidity |
|---|---|
| `#[account] struct Game` at a PDA | `struct Game` inside `mapping(uint256 => Game)` |
| `Context` and the signer | `msg.sender` |
| `require!(cond, Error)` | `if (!cond) revert Error();` |
| `setup_game`, `play` | `newGame`, `play` |
| Counting account size in bytes | Storage slots: each `uint8` or `address` packs into 32-byte slots, and you pay for each slot you write |

## You'll use

`enum`, nested fixed arrays (`Sign[3][3]`), `struct` in a `mapping`, `storage` pointers, custom errors and events.

## Discuss

Every move costs gas and is public. What would you change to play rock-paper-scissors instead?
