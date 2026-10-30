// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Lab 02: Mini Blockchain
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
        difficultyBits = _difficultyBits;
        blocks.push(); // genesis: hash 0, previousHash 0, nonce 0, no transactions
    }

    function addTransaction(string calldata transaction) external {
        pending.push(transaction);
        emit TransactionAdded(pending.length - 1, transaction);
    }

    function pendingTransactions() external view returns (string[] memory) {
        return pending;
    }

    function blockCount() external view returns (uint256) {
        return blocks.length;
    }

    function getBlock(uint256 index) external view returns (Block memory) {
        if (index >= blocks.length) revert NoSuchBlock(index);
        return blocks[index];
    }

    function lastHash() public view returns (bytes32) {
        return blocks[blocks.length - 1].hash;
    }

    function hashBlock(bytes32 previousHash, uint256 nonce, string[] memory txs) public pure returns (bytes32) {
        return keccak256(abi.encode(previousHash, nonce, txs));
    }

    function meetsDifficulty(bytes32 hash) public view returns (bool) {
        return difficultyBits == 0 || uint256(hash) >> (256 - difficultyBits) == 0;
    }

    function mine(uint256 nonce) external {
        bytes32 prev = lastHash();
        bytes32 h = hashBlock(prev, nonce, pending);
        if (!meetsDifficulty(h)) revert InvalidNonce();

        Block storage b = blocks.push();
        b.hash = h;
        b.previousHash = prev;
        b.nonce = nonce;
        b.transactions = pending;
        delete pending;

        emit BlockMined(blocks.length - 1, h);
    }

    function isValid() external view returns (bool) {
        for (uint256 i = 1; i < blocks.length; i++) {
            Block memory b = blocks[i];
            if (b.previousHash != blocks[i - 1].hash) return false;
            if (b.hash != hashBlock(b.previousHash, b.nonce, b.transactions)) return false;
            if (!meetsDifficulty(b.hash)) return false;
        }
        return true;
    }
}
