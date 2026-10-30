# Lab 16: Transparent Public Procurement

**The problem:** a public tender where invoices are faked, bids are altered after the fact, and the winner is known before the deadline.
**Your job:** write `src/Tender.sol`. Suppliers submit **sealed** bids with a deposit, the agency's budget sits in escrow, the lowest honest bid wins, and the winner is paid only when delivery is confirmed.

The constructor and `phase()` are given (time logic is not the lesson). Everything else is yours.

## Timeline

```
 deploy                biddingEnd                    revealEnd
   |---- Bidding ----------|------- Reveal -------------|--- finalize() --> Awarded --> Delivered
   |  bid(sealed, BOND)    |  reveal(price, salt)       |                   or NoWinner
   |  (now < biddingEnd)   |  (biddingEnd <= now < revealEnd)
```

A bid at exactly `biddingEnd` is too late. A reveal at exactly `biddingEnd` is allowed. A reveal at exactly `revealEnd` is too late.

## Rules

- `BOND = 0.1 ether`, paid with `bid`. A sealed bid is `keccak256(abi.encodePacked(msg.sender, price, salt))`.
- The budget is the `msg.value` of the constructor and must be above 0.
- Revealed bidders who lose get their bond back. Bidders who never reveal (or never reveal correctly) forfeit it to the agency. The winner's bond comes back with the payment.
- A bid above `budget` may be revealed but cannot win. A tie on the lowest price goes to the one who revealed first.
- Everything leaves the contract through `withdraw()`.

## User stories

Each story matches tests named `test_US<k>_...`. Suppliers in the tests are kofi, esi and yaw; the budget is 10 ether, bidding lasts 3 days and the reveal window 2 days.

1. **The agency opens a tender with the budget in escrow.** Given: the constructor, a zero budget reverts `ZeroBudget()`.
2. **Suppliers submit sealed bids with a bond.** `sealBid`, then `bid`: `TooLate`, `WrongBond`, `AlreadyBid`.
3. **Suppliers reveal in the reveal window.** `reveal`: `TooEarly`, `TooLate`, `NoBid`, `AlreadyRevealed`, `BadReveal`. A bad reveal reverts, so the bond stays locked and is forfeited at `finalize` if the supplier never reveals correctly.
4. **The lowest revealed bid within budget wins.** The leader is tracked in `reveal`; `finalize` sorts out the bonds and either awards the tender or declares `NoWinner` (the agency gets the whole budget back).
5. **Payment is released only on confirmed delivery.** `confirmDelivery`: `NotAgency`, `WrongPhase`.
6. **Everyone withdraws what they're owed.** `withdraw` pays out `pendingWithdrawals`. After everyone has withdrawn the contract holds 0.

```bash
forge test               # run all tests
forge test --mt test_US4 # run one story
forge test -vvv          # show why a test failed
```

You're done when you see `21 passed; 0 failed`.

## You'll use

`enum`, `block.timestamp`, `keccak256` and `abi.encodePacked`, `payable`, `mapping`, a loop over a stored array, custom errors, and pull payments. Read the [blind auction](https://burkifa23.github.io/abc/docs/m07-by-example/03-blind-auction/) lesson first if you are stuck.

## Discuss

Sealed bids hide prices, but everyone can see *who* bid and when. Does that still leak information that could help collusion?
