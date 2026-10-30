# Lab 02: Mini Blockchain

**The problem:** a ledger kept by one person can be quietly rewritten.
**Your job:** build a tiny chain where each block is locked to the one before it, and where making a block takes real work.

The tests play the part of the miner: they search for a nonce, and your contract checks it. That is the same split as miner versus network on a real chain.

## Steps

Open `src/MiniChain.sol`. Run `forge test`: every test fails at first. Fix the TODOs in order. Each test name, such as `test_05_...`, matches a TODO number.

### Part 1: A ledger anyone can check

1. **Start with a genesis block** (TODO 1). The first block has no parent, so its hash and `previousHash` are all zeros. `forge test --mt test_01`
2. **Collect transactions** (TODO 2 and 3). `addTransaction` stores text like `"Ama pays Kofi 5"` in the pending pool and emits `TransactionAdded` with its position. `pendingTransactions` returns the pool. `forge test --mt test_02`
3. **Read the chain** (TODO 4). `blockCount`, `getBlock` (revert `NoSuchBlock(index)` when out of range) and `lastHash`. `forge test --mt test_07`

### Part 2: Linking blocks with hashes

4. **Hash a block** (TODO 5). `hashBlock` returns `keccak256(abi.encode(previousHash, nonce, txs))`. Change one character in one transaction and the hash changes completely. `forge test --mt test_03`

### Part 3: Making blocks expensive to fake

5. **Check difficulty** (TODO 6). A hash is good when its top `difficultyBits` bits are zero. With 8 bits, about 1 hash in 256 qualifies. With 0 bits, every hash qualifies. `forge test --mt test_04`
6. **Mine a block** (TODO 7). `mine(nonce)` hashes the pending pool with the last hash, reverts `InvalidNonce()` if the hash is too easy, and otherwise stores the block, empties the pool and emits `BlockMined`. An empty pool is allowed, as on real chains. `forge test --mt test_05` and `forge test --mt test_06`
7. **Validate the whole chain** (TODO 8). `isValid` walks every block after genesis and checks the link, the hash and the difficulty. Tampering with an old transaction must make it return false. `forge test --mt test_08` and `forge test --mt test_09`

You're done when you see `11 passed; 0 failed`.

```bash
forge test               # run all tests
forge test --mt test_06  # run one step
forge test -vvv          # show why a test failed
```

## You'll use

`struct`, dynamic arrays, `keccak256`, `abi.encode`, bit shifts, `memory` versus `storage`, custom errors and events.

## Discuss

Real chains do the mining off-chain. Why would mining inside a contract be a bad idea on mainnet?
