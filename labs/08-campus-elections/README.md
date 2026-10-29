# Lab 08: Secure Campus Elections

**The problem:** someone stuffs ballot boxes and alters the tallies.
**Your job:** write a voting contract that allows one vote per registered wallet and keeps a count anyone can check.

## Steps

1. Open `src/Election.sol`. It has 10 TODOs.
2. Run `forge test`. Every test fails at first.
3. Fix the TODOs in order. Each test name, such as `test_04_...`, matches a TODO number.
4. You're done when you see `11 passed; 0 failed`.

```bash
forge test             # run all tests
forge test --mt test_04  # run one step
forge test -vvv        # show why a test failed
```

## You'll use

`struct`, arrays, `mapping`, `msg.sender`, custom errors, and events. See the [docs](https://burkifa23.github.io/abc/docs/).

## Discuss

The admin decides who gets registered. What happens if the admin is corrupt? How could you limit that power?
