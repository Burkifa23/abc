// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Lab 06: Word Guess
contract WordGuess {
    error NotOwner();
    error NoSecret();

    event SecretSet(uint256 indexed round, bytes32 secretHash);
    event HintAdded(uint256 indexed round, string hint);
    event Guessed(uint256 indexed round, address indexed guesser, string guess, bool correct);

    address public immutable owner; // immutable: takes no storage slot
    string private naiveSecret; // slot 0: the "wrong way"
    bytes32 public secretHash; // slot 1
    uint256 public round; // slot 2
    string[] internal hints;
    address[] internal winners;

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setNaiveSecret(string calldata word) external onlyOwner {
        naiveSecret = word;
    }

    function hashWord(string calldata word) public pure returns (bytes32) {
        return keccak256(bytes(word));
    }

    function setSecret(bytes32 hash) external onlyOwner {
        round++;
        secretHash = hash;
        delete hints;
        delete winners;
        emit SecretSet(round, hash);
    }

    function addHint(string calldata hint) external onlyOwner {
        hints.push(hint);
        emit HintAdded(round, hint);
    }

    function viewHints() external view returns (string[] memory) {
        return hints;
    }

    function makeGuess(string calldata guess) external returns (bool correct) {
        if (secretHash == bytes32(0)) revert NoSecret();
        correct = hashWord(guess) == secretHash;
        if (correct) winners.push(msg.sender);
        emit Guessed(round, msg.sender, guess, correct);
    }

    function viewWinners() external view returns (address[] memory) {
        return winners;
    }
}
