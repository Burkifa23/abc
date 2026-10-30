# Lab 17: Immutable Land Title Registry

**The problem:** a corrupt clerk sells the same field to two buyers, or quietly changes who owns it. Courts spend years untangling the paperwork.
**Your job:** write `src/LandRegistry.sol`. Each physical plot maps to exactly one ERC-721 title, so a second title for the same land is impossible. Disputed plots can be frozen, and every past owner stays on record.

This lab is about **inheritance and registry rules**, not about writing ERC-721 a third time. `src/ERC721Minimal.sol` is a complete ERC-721 base. Read it, do not edit it. Your `LandRegistry is ERC721Minimal` overrides one hook, `_beforeTransfer(from, to, id)`, which the base calls on every mint and every transfer, including transfers by an approved operator.

A plot is identified by `(string region, uint256 plotNumber)`. Its token id is `uint256(keccak256(abi.encode(region, plotNumber)))`.

## User stories

Each story matches tests named `test_US<k>_...`.

1. **Each plot has one deterministic id.** `plotId`. Use `abi.encode`, not `encodePacked`, because the region is dynamic.
2. **Only the registrar issues titles, and never twice.** The deployer is `registrar`. `register` reverts `NotRegistrar()`, `ZeroArea()` and `AlreadyRegistered(id)`, otherwise mints the title to the owner and emits `PlotRegistered`.
3. **Owners sell titles with normal transfers.** This comes from the base contract.
4. **Disputed plots are frozen.** `setDisputed(id, true)` makes every transfer revert `Disputed(id)` in the hook, even by an approved operator. `setDisputed(id, false)` thaws it. Only the registrar may do either.
5. **Every owner is on record.** `ownershipHistory(id)` lists all owners in order, the first registrant first.
6. **A court order can reassign a frozen plot.** `courtOrderTransfer(id, to)`, registrar only. It skips the dispute freeze, records history, clears the dispute and emits `CourtOrderTransfer`.
7. **Unknown plots revert clearly.** `UnknownPlot(id)` from `plot`, `ownershipHistory`, `setDisputed` and `courtOrderTransfer`.

```bash
forge test               # run all tests
forge test --mt test_US4 # run one story
forge test -vvv          # show why a test failed
```

You're done when you see `16 passed; 0 failed`.

## You'll use

`is` (inheritance), `virtual` / `override`, `abi.encode`, `struct` in a mapping, dynamic arrays, custom errors with arguments, and events. See the [docs](https://burkifa23.github.io/abc/docs/).

## Discuss

The chain guarantees one title per plot *id*. What stops a clerk registering the same field under a slightly different region name ("Accra" vs "Greater Accra")?
