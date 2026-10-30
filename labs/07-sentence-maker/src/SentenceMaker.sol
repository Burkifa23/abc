// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Lab 07: Sentence Maker
/// Build the contract described in README.md until `forge test` is all green.
/// Declarations are given. You choose how to store the words.
/// Do not rename anything here: the tests depend on these names.
contract SentenceMaker {
    struct Word {
        address id;
        string word;
    }

    error EmptyWord();
    error NoSpacesAllowed();
    error SentenceComplete();
    error TwoWordsInARow();
    error NotOwner();

    event WordAdded(address indexed by, string word);

    address public immutable owner;

    // TODO: add your storage here. Hint: `Word[] internal words;`

    constructor(string memory firstWord) {
        owner = msg.sender; // already written: `immutable` must be set here
        // TODO: validate and store the first word, authored by msg.sender, and emit WordAdded.
        //       Hint: write a private function `_validate(string memory)` and reuse it in addWord.
    }

    function addWord(string calldata word) external {
        // TODO: reject a complete sentence, then an empty word or one with a space,
        //       then a second word in a row from the same account. Store the word and emit WordAdded.
    }

    function isComplete() public view returns (bool) {
        // TODO: true when the last byte of the last word is '.', '?' or '!'.
    }

    function viewSentence() external view returns (string memory) {
        // TODO: all the words joined by single spaces.
    }

    function viewWords() external view returns (Word[] memory) {
        // TODO: owner only (revert NotOwner()). Return every word with the account that added it.
    }
}
