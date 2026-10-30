# Lab 04: Video Game Marketplace

**The problem:** a campus game shop needs a trustworthy record of who has how many coins and which items.
**Your job:** write `src/GameMarketplace.sol` so that every user story below passes. There are no step-by-step hints: you decide how to store the data.

The shop in the tests sells `sword: 10`, `shield: 15`, `potion: 5` and `crown: 41` coins.

## User stories

Each story matches tests named `test_US<k>_...`.

1. **The game is created with a list of items and prices.** The constructor gets two arrays. `itemCount()` and `itemAt(i)` read them back. Different lengths revert `LengthMismatch()`. A price of 0 reverts `ZeroPrice(name)`, because 0 means "unknown item".
2. **A player joins once and gets 40 coins.** `join()` emits `Joined`. A second call reverts `AlreadyJoined()`.
3. **Unknown items have price 0.** `priceOf("bow")` returns 0 instead of reverting.
4. **Buying needs a joined player and a known item.** Otherwise revert `NotJoined()` or `UnknownItem(name)`.
5. **Buying costs coins and adds to the inventory.** `buy` charges the price, increases `inventory(player, item)` and emits `Bought`. Too few coins reverts `InsufficientCoins(needed, available)`. Having exactly enough is fine and leaves 0.
6. **Selling returns half the price.** `sell` removes one item, pays back half the price rounded down, and emits `Sold`. Selling something you do not own reverts `NotOwned(name)`.

```bash
forge test               # run all tests
forge test --mt test_US5 # run one story
forge test -vvv          # show why a test failed
```

You're done when you see `13 passed; 0 failed`.

## You'll need

- a `mapping` from an item key to its price
- a nested `mapping`: player, then item key, then how many they own
- `keccak256(bytes(name))` to turn a `string` into a fixed-size key
- custom errors with arguments, and events

## Discuss

freeCodeCamp's version needed miners and signatures for each purchase. What does the EVM give you for free here?
