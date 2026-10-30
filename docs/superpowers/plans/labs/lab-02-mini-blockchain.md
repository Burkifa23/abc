# Lab 02: Mini Blockchain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Students build a toy blockchain *inside* a contract: a genesis block, a transaction pool, hashing, proof-of-work, and chain validation. That makes the m00 ideas concrete in Solidity.

**Architecture:** `labs/02-mini-blockchain/` built with the Lab Recipe (plan 02). The contract checks proof-of-work and the tests do the mining, the same split as miner versus network.

**Tech Stack:** Foundry, forge-std, Solidity ^0.8.24.

**Spec:** `docs/superpowers/specs/2026-10-29-abc-learning-platform-design.md`. Recipe: plan 02 § Lab Recipe.

**Adapted from:** freeCodeCamp web3 "learn digital ledgers by building a blockchain" and "learn proof-of-work consensus by building a block mining algorithm". Their JSON files become storage arrays, `sha256(nonce + previousHash + JSON)` becomes `keccak256(abi.encode(previousHash, nonce, txs))`, and "hash starts with 00" becomes "the top N bits are zero".

## Global Constraints

- Plan 02 constraints apply.
- Difficulty is in **bits** (`uint8 difficultyBits`). Tests use `8`, so about 256 hashes per block keeps `forge test` fast.

## Review Focus

1. **Mining with an empty pool.** Allowed. A block with no transactions is valid, as on real chains. `test_06b_MinesEmptyBlock`.
2. **Tampering with an old block's transaction.** `isValid()` must return false. `test_09_DetectsTampering`, using a harness that inherits the contract.
3. **`difficultyBits = 0`.** Every hash is valid. `test_04b_ZeroDifficultyAcceptsAll`.
4. **`difficultyBits > 255`** can't be passed because the type is `uint8`, but `256 - bits` must not underflow for `bits = 0`. Covered by 3.

## lab.json

`{ "n": 2, "slug": "mini-blockchain", "title": "Mini Blockchain", "kind": "learn", "summary": "Build blocks, hashes and proof-of-work inside a smart contract.", "concepts": ["struct", "dynamic arrays", "keccak256", "abi.encode", "proof of work", "events"], "adaptedFrom": "freeCodeCamp web3: digital ledgers + proof-of-work", "docs": ["m00-foundations/03-blocks-and-mining", "m03-types/07-arrays-and-slices", "m04-units-and-globals/04-errors-math-crypto"], "openFiles": ["README.md", "src/MiniChain.sol"] }`

## Interface (`src/MiniChain.sol`)

```solidity
contract MiniChain {
    struct Block { bytes32 hash; bytes32 previousHash; uint256 nonce; string[] transactions; }
    error InvalidNonce();
    error NoSuchBlock(uint256 index);
    event TransactionAdded(uint256 indexed poolIndex, string transaction);
    event BlockMined(uint256 indexed index, bytes32 hash);

    uint8 public immutable difficultyBits;
    Block[] internal blocks;          // internal so the test harness can tamper
    string[] internal pending;

    constructor(uint8 _difficultyBits); // pushes genesis: hash 0, previousHash 0, nonce 0, no txs
    function addTransaction(string calldata transaction) external;
    function pendingTransactions() external view returns (string[] memory);
    function blockCount() external view returns (uint256);
    function getBlock(uint256 index) external view returns (Block memory);   // NoSuchBlock if out of range
    function lastHash() public view returns (bytes32);
    function hashBlock(bytes32 previousHash, uint256 nonce, string[] memory txs) public pure returns (bytes32); // keccak256(abi.encode(...))
    function meetsDifficulty(bytes32 hash) public view returns (bool);  // difficultyBits == 0 || uint256(hash) >> (256 - difficultyBits) == 0
    function mine(uint256 nonce) external;  // hashes pending with lastHash; InvalidNonce if too hard; pushes block, clears pending, emits
    function isValid() external view returns (bool); // for i >= 1: previousHash == blocks[i-1].hash, hash == hashBlock(...), meetsDifficulty(hash)
}
```

## Tests (`test/MiniChain.t.sol`)

`setUp` deploys `new MiniChain(8)`. Helper `_findNonce(bytes32 prev, string[] memory txs) returns (uint256)` loops from 0 until `chain.meetsDifficulty(chain.hashBlock(prev, n, txs))`. `MiniChainHarness is MiniChain` adds `tamper(uint256 i, uint256 j, string memory t)`.

| Test | Asserts |
|---|---|
| `test_01_HasGenesisBlock` | `blockCount()==1`, genesis hash and previousHash are `bytes32(0)` |
| `test_02_AddsToPool` | after two `addTransaction`, `pendingTransactions()` equals `["Ama pays Kofi 5","Kofi pays Esi 2"]`; emits `TransactionAdded(1, …)` |
| `test_03_HashesBlockData` | `hashBlock(p,n,txs) == keccak256(abi.encode(p,n,txs))` and changes when one tx char changes |
| `test_04_ChecksDifficulty` | `meetsDifficulty(bytes32(uint256(1)))` true; `meetsDifficulty(bytes32(type(uint256).max))` false |
| `test_04b_ZeroDifficultyAcceptsAll` | `new MiniChain(0).meetsDifficulty(bytes32(type(uint256).max))` true |
| `test_05_RejectsBadNonce` | a nonce whose hash fails difficulty → `InvalidNonce` (find one by looping) |
| `test_06_MinesBlock` | mined block links `previousHash` to genesis hash, stores nonce and txs, pool empty, `BlockMined(1, h)` |
| `test_06b_MinesEmptyBlock` | mining with empty pool succeeds |
| `test_07_GetBlockOutOfRange` | `getBlock(5)` reverts `NoSuchBlock(5)` |
| `test_08_ChainIsValid` | after mining 3 blocks, `isValid()` true |
| `test_09_DetectsTampering` | harness: mine 2 blocks, `tamper(1,0,"Ama pays Kofi 500")`, `isValid()` false |

## Starter

All functions keep their signatures. The constructor body and every function body are `// TODO <k>` comments, in this order: genesis (1), addTransaction (2), pendingTransactions (3), blockCount/getBlock/lastHash (4), hashBlock (5), meetsDifficulty (6), mine (7), isValid (8).

## README

The README keeps the freeCodeCamp narrative: "a ledger anyone can check" → "linking blocks with hashes" → "making blocks expensive to fake". Each step names its test. **Discuss:** Real chains do the mining off-chain. Why would mining *inside* a contract be a bad idea on mainnet? (gas, and everyone re-executes it)

---

### Task A: Tests and solution

- [ ] **Step 1:** Create `labs/02-mini-blockchain/foundry.toml` (copied from lab 08) and the test file with every test in the Tests table.
- [ ] **Step 2:** Write the full solution in `src/MiniChain.sol` against the Interface above.
- [ ] **Step 3: Run in a Codespace.** `cd labs/02-mini-blockchain && forge test`. Expected: `11 passed; 0 failed`.
- [ ] **Step 4:** `mkdir -p .solution/src && cp src/MiniChain.sol .solution/src/`
- [ ] **Step 5: Commit.** `git add labs/02-mini-blockchain && git commit -m "test(lab-02): tests and reference solution"`

### Task B: Starter, README, metadata

- [ ] **Step 1:** Turn `src/MiniChain.sol` into the starter, using the Starter section above. Keep every declaration the tests use.
- [ ] **Step 2:** Write `README.md` and `lab.json` as above, then run `node scripts/sync-labs.mjs`.
- [ ] **Step 3: Verify.** `bash scripts/verify-lab.sh labs/02-mini-blockchain`. Expected: `PASS labs/02-mini-blockchain`.
- [ ] **Step 4: Commit.** `git add -A labs/02-mini-blockchain .devcontainer site/src/labs.json && git commit -m "feat(lab-02): Mini Blockchain lab"`

