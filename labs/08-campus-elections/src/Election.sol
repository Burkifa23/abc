// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Workshop 3: Secure Campus Elections
/// Fill in every function marked TODO until `forge test` is all green.
/// Do not rename anything here: the tests depend on these names.
contract Election {
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    error NotAdmin();
    error NotRegistered();
    error AlreadyVoted();
    error InvalidCandidate();

    event Voted(address indexed voter, uint256 indexed candidateId);

    address public admin;
    Candidate[] public candidates;
    mapping(address => bool) public isRegistered;
    mapping(address => bool) public hasVoted;

    constructor(string[] memory candidateNames) {
        // TODO 1: make the deployer (msg.sender) the admin.
        // TODO 2: push one Candidate per name, starting with 0 votes.
    }

    function candidateCount() external view returns (uint256) {
        // TODO 3: return how many candidates there are.
    }

    function registerVoter(address voter) external {
        // TODO 4: only the admin may register voters (revert NotAdmin otherwise).
        // TODO 5: mark the voter as registered.
    }

    function vote(uint256 candidateId) external {
        // TODO 6: revert NotRegistered if msg.sender is not registered.
        // TODO 7: revert AlreadyVoted if msg.sender already voted.
        // TODO 8: revert InvalidCandidate if candidateId is out of range.
        // TODO 9: record the vote, count it, and emit Voted.
    }

    function winner() external view returns (string memory) {
        // TODO 10: return the name of the candidate with the most votes.
        // On a tie, the candidate with the lower id wins.
    }
}
