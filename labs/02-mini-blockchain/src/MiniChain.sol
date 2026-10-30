// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Lab 02: Mini Blockchain
/// Fill in every TODO until `forge test` is all green.
/// Do not rename anything here: the tests depend on these names.
contract MiniChain {
    struct Block {
        bytes32 hash;
        bytes32 previousHash;
        uint256 nonce;
        string[] transactions;
    }

    error InvalidNonce();
    error NoSuchBlock(uint256 index);

    event TransactionAdded(uint256 indexed poolIndex, string transaction);
    event BlockMined(uint256 indexed index, bytes32 hash);

    uint8 public immutable difficultyBits;
    Block[] internal blocks; // internal so the test harness can tamper
    string[] internal pending;

    constructor(uint8 _difficultyBits) {
        difficultyBits = _difficultyBits; // already written: `immutable` must be set here
        // TODO 1: push the genesis block: hash 0, previousHash 0, nonce 0, no transactions.
        //         Hint: `blocks.push();` adds an empty (all zero) Block.
    }

    function addTransaction(string calldata transaction) external {
        // TODO 2: add `transaction` to `pending`, then emit TransactionAdded(index it was stored at, transaction).
    }

    function pendingTransactions() external view returns (string[] memory) {
        // TODO 3: return the whole `pending` array.
    }

    function blockCount() external view returns (uint256) {
        // TODO 4a: return how many blocks there are.
    }

    function getBlock(uint256 index) external view returns (Block memory) {
        // TODO 4b: revert NoSuchBlock(index) when index is past the end, else return that block.
    }

    function lastHash() public view returns (bytes32) {
        // TODO 4c: return the hash of the newest block.
    }

    function hashBlock(bytes32 previousHash, uint256 nonce, string[] memory txs) public pure returns (bytes32) {
        // TODO 5: return keccak256(abi.encode(previousHash, nonce, txs)).
    }

    function meetsDifficulty(bytes32 hash) public view returns (bool) {
        // TODO 6: a hash is good when its top `difficultyBits` bits are zero.
        //         Hint: uint256(hash) >> (256 - difficultyBits) == 0, and zero bits accepts everything.
    }

    function mine(uint256 nonce) external {
        // TODO 7: hash `pending` with lastHash() and `nonce`; revert InvalidNonce() if it fails the difficulty.
        //         Otherwise push a new Block (with the pending transactions), clear `pending`,
        //         and emit BlockMined(new block's index, hash).
    }

    function isValid() external view returns (bool) {
        // TODO 8: for every block after genesis, check that previousHash equals the earlier block's hash,
        //         that hash equals hashBlock(...) of its own data, and that it meetsDifficulty.
        //         Return false at the first failure, true at the end.
    }
}
