# Lab 05: Shared Bank

**The problem:** a campus savings group keeps its cash in one shared box, and nobody can prove who owns how much.
**Your job:** write a contract that holds real ether, tracks each person's share, and cannot be drained by a clever attacker.

## Steps

Open `src/SharedBank.sol`. Run `forge test`: every test fails at first. Fix the TODOs in order. Each test name, such as `test_04_...`, matches a step.

1. **Start empty.** The state variables are given. `forge test --mt test_01`
2. **Deposit** (TODO 1). A function marked `payable` can receive ether, and `msg.value` says how much. Add it to the sender's balance and to `totalDeposits`, emit `Deposited`, and revert `ZeroAmount()` for 0. `forge test --mt test_02`
3. **Plain ether** (TODO 2). Sending ether with no function name runs `receive()`. Make it call `deposit()`. `forge test --mt test_03`
4. **Withdraw** (TODO 4, first version). Check the balance, subtract, then send with `payable(msg.sender).call{value: amount}("")`. Revert `TransferFailed()` if the call fails. Never use `transfer` or `send`. `forge test --mt test_04` and `forge test --mt test_05`
5. **Transfer inside the bank** (TODO 3). Move a balance from one account to another. No ether moves. Sending to yourself must change nothing. `forge test --mt test_06` and `forge test --mt test_07`

You're done with the basics when `test_01` to `test_07` pass. The bank must always hold exactly `totalDeposits` of ether; the tests check this.

## Step 8: Reentrancy

`test_08` deploys an `Attacker` contract. When the bank sends it ether, its `receive()` function calls `withdraw` again before the first call has finished. If your bank has not yet lowered the attacker's balance, the second call succeeds, then a third, and so on, until the bank is empty.

The defence is **checks, effects, interactions**: check the inputs, update your own records, and only then call out to another address. Make sure `withdraw` follows that order.

```bash
forge test --mt test_08
```

### Break it on purpose

Move the line that subtracts the balance below the `.call`, then run `forge test --mt test_08` and watch the attacker drain the bank. Put the order back and run it again.

```bash
forge test               # run all tests
forge test --mt test_04  # run one step
forge test -vvv          # show why a test failed
```

You're done when you see `11 passed; 0 failed`.

## You'll use

`payable`, `msg.value`, `receive()`, low-level `call`, mappings, custom errors with arguments, and events.

## Discuss

Why does ABC's procurement lab (16) use "withdraw" instead of paying winners directly?
