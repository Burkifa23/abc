// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ICivicElection} from "./interfaces/ICivicElection.sol";

/// @title CivicElection
/// @notice One vote per registered wallet, with a tally anyone can check.
contract CivicElection is ICivicElection {
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    address public immutable admin;
    Candidate[] public candidates;
    mapping(address => bool) public isRegistered;
    mapping(address => bool) public hasVoted;

    /// @param candidateNames The names on the ballot. The deployer becomes the admin.
    constructor(string[] memory candidateNames) {
        admin = msg.sender;
        for (uint256 i = 0; i < candidateNames.length; i++) {
            candidates.push(Candidate(candidateNames[i], 0));
        }
    }

    /// @notice How many candidates are on the ballot.
    function candidateCount() external view returns (uint256) {
        return candidates.length;
    }

    /// @notice Lets a wallet vote. Only the admin may call this.
    function registerVoter(address voter) external {
        if (msg.sender != admin) revert NotAdmin();
        isRegistered[voter] = true;
    }

    /// @notice Casts the caller's single vote for a candidate.
    function vote(uint256 candidateId) external {
        if (!isRegistered[msg.sender]) revert NotRegistered();
        if (hasVoted[msg.sender]) revert AlreadyVoted();
        if (candidateId >= candidates.length) revert InvalidCandidate();
        hasVoted[msg.sender] = true;
        candidates[candidateId].voteCount++;
        emit Voted(msg.sender, candidateId);
    }

    /// @notice The name of the candidate with the most votes. On a tie the lower id wins.
    function winner() external view returns (string memory) {
        uint256 best;
        for (uint256 i = 1; i < candidates.length; i++) {
            if (candidates[i].voteCount > candidates[best].voteCount) best = i;
        }
        return candidates[best].name;
    }
}
