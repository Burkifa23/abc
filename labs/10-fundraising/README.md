# Lab 10: Fundraising

**The problem:** a student wants to raise money "for my start up", but donors only want to give if the goal is reached in time. If it is not, they want every cedi back.
**Your job:** write `src/Fundraiser.sol` so that every user story below passes. The contract is a small state machine: `Open`, then either `Succeeded` or `Failed`.

In the tests the goal is 150 ether, the duration is 7 days and the description is "Smart contract".

## User stories

Each story matches tests named `test_US<k>_...`.

1. **It starts open with a description.** The constructor is given. Check that you understand what it sets.
2. **The creator can change the description.** `updateDescription` is creator only (`NotCreator()`) and emits `DescriptionUpdated`. Fill in the `onlyCreator` modifier first.
3. **Anyone donates while it is open.** `donate` is `payable`, records the contribution, adds to `raised` and emits `Donated`. Zero reverts `ZeroDonation()`. After the deadline, or once the goal is reached, it reverts `NotOpen()`. A donation that overshoots the goal is accepted in full.
4. **Reaching the goal lets the creator claim everything.** When `raised >= goal`, the status becomes `Succeeded` immediately and `GoalReached` is emitted. `claim` sends the whole balance to the creator. Others get `NotCreator()`, and before success the creator gets `NotSucceeded()`.
5. **After the deadline without the goal, it fails.** Anyone can call `finalize`. Before the deadline it reverts `TooEarly()`.
6. **Donors get refunds when it fails.** `refund` sends back the caller's contribution. A second refund reverts `NothingToRefund()`, because you zero the contribution *before* sending. While the status is not `Failed`, it reverts `NotFailed()`.
7. **The creator can cancel while it is open.** `cancel` sets the status to `Failed` so donors can claim refunds. After success it reverts `NotOpen()`, so a creator cannot take the money and then also cancel.

```bash
forge test               # run all tests
forge test --mt test_US3 # run one story
forge test -vvv          # show why a test failed
```

You're done when you see `17 passed; 0 failed`.

## Why pull payments?

The contract never loops over donors to pay them. Each donor calls `refund` for their own money, and the creator calls `claim`. One failing receiver cannot block everyone else, and the cost of each call does not grow with the number of donors.

## You'll use

`enum`, `modifier`, `payable`, `block.timestamp`, `immutable`, low-level `call{value: ...}`, custom errors and events.

## Discuss

The original version paid donors back automatically. With 5,000 donors, what goes wrong?
