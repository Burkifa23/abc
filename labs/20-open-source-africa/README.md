# Lab 20: Open-Source Africa Capstone

**The goal:** your team turns the civic contracts from earlier labs into **one open-source library** that meets published interfaces and quality gates, ready to release under the club's name.

| Contract | From lab | Interface |
|---|---|---|
| `CivicElection` | 08 Campus Elections | `src/interfaces/ICivicElection.sol` |
| `ClubAccess` | 11 Anonymous Access | `src/interfaces/IClubAccess.sol` |
| `Tender` | 16 Procurement | `src/interfaces/ITender.sol` |
| `LandRegistry` | 17 Land Registry | `src/interfaces/ILandRegistry.sol` |

The interfaces copy the external functions, events and errors of those labs exactly, so code that passed the earlier lab passes here with renames at most. `src/ERC721Minimal.sol` (the ERC-721 base from lab 17) is complete: `LandRegistry` builds on it.

## What you do

1. Open `src/CivicElection.sol`, `src/ClubAccess.sol`, `src/Tender.sol` and `src/LandRegistry.sol`. Each is a starter: it declares `contract X is IX` with every function present and reverting `"TODO"`. Constructors are described in the interface comments (an interface cannot declare one).
2. Bring in your own solutions from labs 08, 11, 16 and 17 (a getter function may become a `public` variable of the same name).
3. `forge test` runs `test/Conformance.t.sol`: nine tests that exercise every interface function and every custom error. Make them green: `9 passed; 0 failed`.
4. Then meet the release gates below.

```bash
forge test          # conformance tests
forge fmt           # format your code (the gate runs forge fmt --check)
forge coverage      # coverage per file
```

## Release checklist

1. Conformance tests green.
2. `forge fmt` leaves no changes (`forge fmt --check` passes).
3. Line coverage is at least 90% **per contract** (not on average). The check is machine-run: `forge coverage --report summary | node ../../scripts/coverage-gate.mjs 90`. Interfaces are excluded.
4. NatSpec (`@notice`, `@param`) on every external function. This one is **not machine-checked**: review each other's code. `forge doc` builds a site from it.
5. A `SECURITY.md` with a threat list per contract (who can do what, what if the admin is corrupt, what if a key leaks).
6. A `CHANGELOG.md`.
7. Tag `v1.0.0` and publish a GitHub release on your team's fork.

## You'll use

Interfaces, custom errors, inheritance, `forge test`, `forge fmt`, `forge coverage` and NatSpec. See the [docs](https://burkifa23.github.io/abc/docs/).

## Discuss

What would a Ghanaian district assembly need, beyond code, before it could rely on this library?
