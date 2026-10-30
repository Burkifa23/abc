// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Facilitator reference. Learners: try first, peek later.
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
        if (answers_.length < 6) revert NotEnoughAnswers();
        for (uint256 i = 0; i < answers_.length; i++) {
            if (bytes(answers_[i]).length == 0) revert EmptyAnswer();
            _answers.push(answers_[i]);
        }
    }

    function viewAnswers() external view returns (string[] memory) {
        return _answers;
    }

    function getFortune(string calldata question) external returns (string memory answer) {
        if (bytes(question).length == 0) revert EmptyQuestion();
        uint256 index =
            uint256(keccak256(abi.encode(question, msg.sender, block.prevrandao, _fortunes.length))) % _answers.length;
        answer = _answers[index];
        _fortunes.push(Fortune(msg.sender, question, answer));
        emit FortuneTold(msg.sender, question, answer);
    }

    function viewQuestions() external view returns (Fortune[] memory) {
        return _fortunes;
    }
}
