// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Campus elections (lab 08). Constructor: `constructor(string[] memory candidateNames)`, the deployer is the admin.
interface ICivicElection {
    error NotAdmin();
    error NotRegistered();
    error AlreadyVoted();
    error InvalidCandidate();

    event Voted(address indexed voter, uint256 indexed candidateId);

    function admin() external view returns (address);
    function candidates(uint256 id) external view returns (string memory name, uint256 voteCount);
    function isRegistered(address voter) external view returns (bool);
    function hasVoted(address voter) external view returns (bool);
    function candidateCount() external view returns (uint256);
    function registerVoter(address voter) external;
    function vote(uint256 candidateId) external;
    /// The candidate with the most votes. On a tie, the lower id wins.
    function winner() external view returns (string memory);
}
