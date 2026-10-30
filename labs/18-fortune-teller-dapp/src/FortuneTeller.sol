// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Lab 18: Fortune Teller dApp (part 1: the contract)
/// Build the contract described in README.md until `forge test` is all green.
/// Declarations are given. Do not rename anything here: the tests depend on these names.
/// NOT secure randomness: block.prevrandao can be nudged by validators. Fine for a fortune, never for a lottery.
contract FortuneTeller {
    struct Fortune {
        address asker;
        string question;
        string answer;
    }

    error NotEnoughAnswers();
    error EmptyAnswer();
    error EmptyQuestion();

    event FortuneTold(address indexed asker, string question, string answer);

    string[] private _answers;
    Fortune[] private _fortunes;

    constructor(string[] memory answers_) {
        // US1: revert NotEnoughAnswers() if there are fewer than 6 answers.
        //      Revert EmptyAnswer() if any answer is an empty string. Otherwise store them all in _answers.
    }

    function viewAnswers() external view returns (string[] memory) {
        // US2: return all the answers.
    }

    function getFortune(string calldata question) external returns (string memory answer) {
        // US3: revert EmptyQuestion() for an empty question.
        //      Pick the answer at index
        //        uint256(keccak256(abi.encode(question, msg.sender, block.prevrandao, _fortunes.length))) % _answers.length
        //      Record Fortune(msg.sender, question, answer) in _fortunes, emit FortuneTold and return the answer.
    }

    function viewQuestions() external view returns (Fortune[] memory) {
        // US4: return every recorded fortune, oldest first.
    }
}
