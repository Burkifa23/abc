# Lab 14: Concert Tickets (ERC-721)

**The problem:** Ashesi Live sells 100 concert tickets. Paper tickets get copied and scalped. An NFT ticket is unique, easy to check at the door, and the organizer can see every sale.
**Your job:** write the ERC-721 standard yourself in `src/ConcertTickets.sol`. The interfaces in `src/interfaces/` are given; you implement them.

Facts: the name is `"Ashesi Live"`, the symbol is `"TIX"`, there are `MAX_SUPPLY = 100` tickets at `PRICE = 0.02 ether` each, and ids start at 1.

## Steps

1. Open `src/ConcertTickets.sol`. It has 12 numbered TODOs.
2. Run `forge test`. Every test fails at first.
3. Fix the TODOs in order. Each test name, such as `test_07_...`, matches a TODO number.
4. You're done when you see `16 passed; 0 failed`.

```bash
forge test               # run all tests
forge test --mt test_07  # run one step
forge test -vvv          # show why a test failed
```

| Step | What you write |
|---|---|
| 1 | `name()` and `symbol()` |
| 2 | `supportsInterface` (see the ERC-165 box) |
| 3 | `buyTicket` mints id `1, 2, 3, ...` to the buyer and emits `Transfer(0, buyer, id)` |
| 4 | `WrongPrice` when the payment is not exactly `PRICE` |
| 5 | `SoldOut` after 100 tickets |
| 6 | `ownerOf` (reverts `ERC721NonexistentToken`) and `balanceOf` |
| 7 | `transferFrom`, `_isAuthorized`, `_transfer` |
| 8 | `approve` and `getApproved`; the approval is cleared on every transfer |
| 9 | `setApprovalForAll` and `isApprovedForAll`; an operator can move any of the owner's tickets |
| 10 | `safeTransferFrom` (both versions) and `_checkReceiver` |
| 11 | `tokenURI` and `_toString`: id 42 gives `ipfs://tix/42.json` |
| 12 | `withdraw`: the organizer collects the sales |

## What is ERC-165?

A wallet or marketplace wants to ask a contract "do you speak ERC-721?" before sending it a token. ERC-165 is the standard way to ask: `supportsInterface(bytes4 id)` returns true for every interface id the contract supports. Each id is a 4-byte fingerprint of the interface's function selectors. You need three: ERC-165 itself (`0x01ffc9a7`), ERC-721 (`0x80ac58cd`) and ERC-721 Metadata (`0x5b5e139f`).

## You'll use

`mapping`, nested mappings, custom errors with arguments, `try/catch` on an external call, `address.code.length`, `string.concat`, interfaces and `payable`. See the [docs](https://burkifa23.github.io/abc/docs/).

## Discuss

Why does `safeTransferFrom` exist? What gets lost when an NFT is sent to a contract that can't handle it?
