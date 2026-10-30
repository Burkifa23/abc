# Lab 03: Signatures

**The problem:** how can a bank, or a blockchain, know that you really asked to send money?
**Your job:** build a coin where a transfer is valid only if it carries a signature from the sender. Anyone can then relay it for them, and nobody can reuse it.

## Warm-up: keys and signatures in the terminal

A wallet is a keypair. The private key signs; the address (derived from the public key) lets anyone check the signature. Try it:

```bash
cast wallet new                                   # prints an address and a private key
cast wallet sign --private-key <key> "hello"      # prints a signature
```

These keys are throwaway. Never paste a real private key into a terminal you do not control.

## Steps

Open `src/SignedCoin.sol`. Run `forge test`: every test fails at first. Fix the TODOs in order. Each test name, such as `test_05_...`, matches a TODO number. The tests sign with Foundry's `vm.sign`, and your contract checks with `ecrecover`.

1. **A faucet** (TODO 1). `faucet()` gives the caller 40 coins, once, and emits `Transfer` from the zero address. `forge test --mt test_01` and `forge test --mt test_02`
2. **Hash what is being signed** (TODO 2). `transferHash` covers this contract, the chain id, sender, receiver, amount and the sender's nonce. `forge test --mt test_03`
3. **Add the wallet prefix** (TODO 3). `toEthSignedMessageHash` adds the standard prefix that wallets use. `forge test --mt test_04`
4. **Recover the signer** (TODO 4). `recover` calls `ecrecover`, and rejects two bad cases: a "high s" twin signature and a garbage signature that recovers to the zero address. `forge test --mt test_05`, `forge test --mt test_07b` and `forge test --mt test_07c`
5. **Relay a signed transfer** (TODO 5). `transferWithSig` checks the signer is `from`, bumps the nonce, moves the coins and emits `Transfer`. Follow the order in the comment. `forge test --mt test_06`
6. **Reject cheats.** The same code should already stop a wrong signer (`test_07`), a replayed signature (`test_08`), a signature made for another chain (`test_08b`), and an overspend (`test_09`). If one fails, check your order of steps.

You're done when you see `12 passed; 0 failed`.

```bash
forge test               # run all tests
forge test --mt test_08  # run one step
forge test -vvv          # show why a test failed
```

## You'll use

`ecrecover`, `keccak256`, `abi.encode`, `abi.encodePacked`, mappings, custom errors with arguments, and events.

## Discuss

Why does the hash include `address(this)` and `block.chainid`? What did freeCodeCamp's JSON chain do instead?
