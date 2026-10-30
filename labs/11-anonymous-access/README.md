# Lab 11: Anonymous Club Access

**The problem:** a campus club wants to let members in without keeping a public list of student IDs, and without letting anyone copy a card or steal an entry.
**Your job:** write `src/ClubAccess.sol` so that every user story below passes.

## How it works

The admin never stores names. Each student is handed a random **secret** offline (think of a scratch card). The admin registers only its hash, the **commitment**. To enter, a student proves they know the secret in two steps:

```
Step 1 (block N):    student -> commitEntry( keccak256(student address, secret) )   "sealed envelope"
                                  |
                                  |  at least one block passes
                                  v
Step 2 (block N+k):  student -> enter( secret )
                       contract checks:  seal matches?  commitment is a member?  not used before?
                       -> hasAccess[student] = true,   commitment marked used
```

Why two steps? If someone watches the pending transactions and sees `enter(secret)`, they could copy the secret and submit it first. But their own seal was committed earlier and was bound to *their* address, so it cannot match. This is a commit-reveal scheme, and it defeats front-running.

Each secret works once (the used commitment is a "nullifier"), so sharing a card does not give two people access.

## User stories

Each story matches tests named `test_US<k>_...`.

1. **The admin registers commitments, never IDs.** `addMember` and `revokeMember` are admin only (`NotAdmin()`). Emit `MemberAdded` and `MemberRevoked`.
2. **Helpers compute commitments and seals.** `commitmentOf(secret)` is `keccak256(abi.encodePacked(secret))`. `sealFor(who, secret)` is `keccak256(abi.encodePacked(who, secret))`.
3. **A member commits a sealed entry.** `commitEntry` stores the seal and the block number and emits `EntryCommitted`.
4. **In a later block, the reveal grants access.** `enter(secret)` checks, in order: a pending entry exists (`NoPendingEntry`), the block is strictly later (`RevealTooEarly`), the seal matches (`SealMismatch`).
5. **Each credential works once.** A second use reverts `AlreadyUsed()`.
6. **The admin can revoke a credential.** A revoked commitment, even with a pending entry, reverts `UnknownCommitment()`.
7. **Unknown secrets are rejected.** `UnknownCommitment()`.

```bash
forge test               # run all tests
forge test --mt test_US4 # run one story
forge test -vvv          # show why a test failed
```

You're done when you see `13 passed; 0 failed`.

## A warning about `abi.encodePacked`

`encodePacked` glues bytes together with no separators. With two dynamic values, `("ab", "c")` and `("a", "bc")` give the same bytes and so the same hash. Here every packed value is fixed-size (`address` and `bytes32`), so the problem cannot happen. Never pack two strings or two dynamic arrays.

## You'll use

`keccak256`, `abi.encodePacked`, `block.number`, `immutable`, mappings, custom errors and events.

## Discuss (Garbage In)

If a corrupt admin adds a commitment for a fake student, what can the contract do about it? What social or legal process has to sit around the code?
