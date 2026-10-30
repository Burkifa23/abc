// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ICivicElection} from "./interfaces/ICivicElection.sol";

/// @title CivicElection
/// @notice One vote per registered wallet, with a tally anyone can check.
/// Starter: every function reverts "TODO". Bring over your lab 08 solution, then polish it
/// (NatSpec, formatting, coverage). The interface is in src/interfaces/ICivicElection.sol.
/// You may replace a getter function with a `public` state variable of the same name and type.
contract CivicElection is ICivicElection {
    /// @param candidateNames The names on the ballot. The deployer becomes the admin.
    constructor(string[] memory candidateNames) {
        candidateNames;
        revert("TODO");
    }

    function admin() external view returns (address) {
        revert("TODO");
    }

    function candidates(uint256) external view returns (string memory, uint256) {
        revert("TODO");
    }

    function isRegistered(address) external view returns (bool) {
        revert("TODO");
    }

    function hasVoted(address) external view returns (bool) {
        revert("TODO");
    }

    function candidateCount() external view returns (uint256) {
        revert("TODO");
    }

    function registerVoter(address) external {
        revert("TODO");
    }

    function vote(uint256) external {
        revert("TODO");
    }

    function winner() external view returns (string memory) {
        revert("TODO");
    }
}
