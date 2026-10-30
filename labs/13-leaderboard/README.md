# Lab 13: Game Leaderboard

**The problem:** the campus game "Rock Destroyer" wants a top-5 board. Players pay a small entry fee, the game server reports their score, and the board always shows the five best players.
**Your job:** write `src/Leaderboard.sol` so that every user story below passes. You decide how to store the board (a sorted `Player[] internal board` works well).

Only the game owner (the game server) submits scores. That is a trust choice: players must trust the server. See the discussion question.

## User stories

Each story matches tests named `test_US<k>_...`.

1. **The board starts empty and the deployer is the game owner.** The constructor and constants are given.
2. **A player pays exactly 0.01 ether to start a game.** `newGame(username)` is `payable`. Wrong fee reverts `WrongFee(sent, required)`. An empty username or one longer than 32 bytes reverts `BadUsername()`. Paying again before a score is submitted reverts `AlreadyPlaying()`. The fee is added to `feesOwed`, which is paid out later (a pull payment), never sent straight away.
3. **Only the game owner submits scores.** Anyone else reverts `NotGameOwner()`.
4. **Submitting ends the paid game.** `submitScore(player, score)` reverts `NotPlaying()` if the player has not paid, and resets `hasPaid` to false afterwards.
5. **The top 5 are kept sorted, one row per player.** Highest score first. A tie keeps the earlier entry ahead. A player already on the board only changes if the new score is strictly better, and never appears twice. On a full board, a score that is not better than the last place is ignored. `ScoreSubmitted` reports the rank (1 to 5), or 0 if the player did not make the board.
6. **The owner withdraws fees with a pull payment.** `withdrawFees` sends `feesOwed` to the owner, zeroing it before the call. With nothing owed it reverts `NothingToWithdraw()`.

```bash
forge test               # run all tests
forge test --mt test_US5 # run one story
forge test -vvv          # show why a test failed
```

You're done when you see `15 passed; 0 failed`.

## Anchor to Solidity

| Solana (Anchor) | Solidity |
|---|---|
| PDA seeds identify a player's account | mapping keys: `hasPaid[addr]`, `usernameOf[addr]` |
| `has_payed` flag on the player | `hasPaid` |
| `initialize_leaderboard` | the constructor |
| Transfer 1 SOL to the game owner | pay `ENTRY_FEE` into the contract, owner calls `withdrawFees` |
| Account space for 5 players | `MAX_LEADERS = 5`: a bounded array keeps gas cost fixed |

## You'll use

`payable`, `msg.value`, a bounded storage array of structs, swapping elements, custom errors with arguments, and events.

## Discuss

The server reports scores. How could the game prove a score without trusting the server? (Signatures from lab 03, or replaying the moves on-chain.)
