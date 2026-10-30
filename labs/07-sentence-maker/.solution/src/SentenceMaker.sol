// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Lab 07: Sentence Maker
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
    Word[] internal words;

    constructor(string memory firstWord) {
        owner = msg.sender;
        _validate(firstWord);
        words.push(Word(msg.sender, firstWord));
        emit WordAdded(msg.sender, firstWord);
    }

    function addWord(string calldata word) external {
        if (isComplete()) revert SentenceComplete();
        _validate(word);
        if (words[words.length - 1].id == msg.sender) revert TwoWordsInARow();
        words.push(Word(msg.sender, word));
        emit WordAdded(msg.sender, word);
    }

    function isComplete() public view returns (bool) {
        bytes memory last = bytes(words[words.length - 1].word);
        bytes1 c = last[last.length - 1];
        return c == "." || c == "?" || c == "!";
    }

    function viewSentence() external view returns (string memory sentence) {
        for (uint256 i = 0; i < words.length; i++) {
            sentence = i == 0 ? words[i].word : string.concat(sentence, " ", words[i].word);
        }
    }

    function viewWords() external view returns (Word[] memory) {
        if (msg.sender != owner) revert NotOwner();
        return words;
    }

    function _validate(string memory word) private pure {
        bytes memory b = bytes(word);
        if (b.length == 0) revert EmptyWord();
        for (uint256 i = 0; i < b.length; i++) {
            if (b[i] == 0x20) revert NoSpacesAllowed();
        }
    }
}
