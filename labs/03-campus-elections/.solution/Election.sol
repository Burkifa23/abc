// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Facilitator reference. Learners: try first, peek later.
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
        admin = msg.sender;
        for (uint256 i = 0; i < candidateNames.length; i++) {
            candidates.push(Candidate(candidateNames[i], 0));
        }
    }

    function candidateCount() external view returns (uint256) {
        return candidates.length;
    }

    function registerVoter(address voter) external {
        if (msg.sender != admin) revert NotAdmin();
        isRegistered[voter] = true;
    }

    function vote(uint256 candidateId) external {
        if (!isRegistered[msg.sender]) revert NotRegistered();
        if (hasVoted[msg.sender]) revert AlreadyVoted();
        if (candidateId >= candidates.length) revert InvalidCandidate();
        hasVoted[msg.sender] = true;
        candidates[candidateId].voteCount++;
        emit Voted(msg.sender, candidateId);
    }

    function winner() external view returns (string memory) {
        uint256 best;
        for (uint256 i = 1; i < candidates.length; i++) {
            if (candidates[i].voteCount > candidates[best].voteCount) best = i;
        }
        return candidates[best].name;
    }
}
