# Lab 06: Word Guess

**The problem:** the class game master wants to host a word-guessing game on-chain, with a secret word and a list of winners.
**Your job:** build the game, and find out why storing the secret word in a `private` variable does not keep it secret.

## Steps

Open `src/WordGuess.sol`. Run `forge test`: every test fails at first. Fix the TODOs in order. Each test name, such as `test_04_...`, matches a step.

1. **The owner.** The constructor already records who deployed the contract. `forge test --mt test_01`
2. **A modifier** (TODO 1). A `modifier` is code that wraps a function. Write `onlyOwner` so it reverts `NotOwner()` for anyone else. The `_;` means "now run the function". `forge test --mt test_02`
3. **Hash a word** (TODO 3). `hashWord` returns `keccak256(bytes(word))`. We will store this hash instead of the word. `forge test --mt test_03`
4. **The spy step: private is not secret** (TODO 2). Implement `setNaiveSecret`, which stores the word in a `private` variable, then run `forge test --mt test_04`. The test reads the raw storage slot with `vm.load` and recovers "akwaaba".

   Why? `private` only stops other *contracts* from reading the variable by name. Storage is public data on the chain, and anyone can read any slot. `owner` is `immutable` and takes no slot, so `naiveSecret` is in slot 0. A short string (31 bytes or fewer) is stored inside its slot: the letters are left-aligned and the lowest byte holds the length times 2. Real secrets must never be stored on-chain, which is why we use a hash.
5. **Hints** (TODO 5). The owner can add hints, and anyone can read them. `forge test --mt test_05`
6. **Start a round** (TODO 4). `setSecret(hash)` starts a new round: increase `round`, store the hash, clear the old hints and winners. `forge test --mt test_09`
7. **Guess** (TODO 6 and 7). `makeGuess` reverts `NoSecret()` before a round starts, compares hashes (case-sensitive), records winners, and emits `Guessed`. `viewWinners` lists them. `forge test --mt test_06`, `forge test --mt test_07` and `forge test --mt test_08`

You're done when you see `11 passed; 0 failed`.

```bash
forge test               # run all tests
forge test --mt test_04  # run one step
forge test -vvv          # show why a test failed
```

## You'll use

`modifier`, `immutable`, `keccak256`, `delete`, dynamic arrays, custom errors and events.

## Discuss

Every guess is a public transaction. How could someone copy a correct guess before it is mined? (This is front-running. Labs 11 and 16 use commit-reveal to fix it.)
