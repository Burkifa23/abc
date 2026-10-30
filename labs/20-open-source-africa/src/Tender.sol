// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ITender} from "./interfaces/ITender.sol";

/// @title Tender
/// @notice A sealed-bid public tender with the budget held in escrow and payment on confirmed delivery.
/// Starter: every function reverts "TODO". Bring over your lab 16 solution, then polish it
/// (NatSpec, formatting, coverage). The interface is in src/interfaces/ITender.sol.
/// You may replace a getter function with a `public` state variable of the same name and type.
contract Tender is ITender {
    /// @param description_ What is being bought.
    /// @param biddingTime Seconds the bidding window stays open.
    /// @param revealTime Seconds the reveal window stays open after bidding.
    constructor(string memory description_, uint256 biddingTime, uint256 revealTime) payable {
        description_;
        biddingTime;
        revealTime;
        revert("TODO");
    }

    function BOND() external view returns (uint256) {
        revert("TODO");
    }

    function agency() external view returns (address) {
        revert("TODO");
    }

    function budget() external view returns (uint256) {
        revert("TODO");
    }

    function biddingEnd() external view returns (uint256) {
        revert("TODO");
    }

    function revealEnd() external view returns (uint256) {
        revert("TODO");
    }

    function description() external view returns (string memory) {
        revert("TODO");
    }

    function winner() external view returns (address) {
        revert("TODO");
    }

    function winningPrice() external view returns (uint256) {
        revert("TODO");
    }

    function sealedBids(address) external view returns (bytes32) {
        revert("TODO");
    }

    function revealed(address) external view returns (bool) {
        revert("TODO");
    }

    function pendingWithdrawals(address) external view returns (uint256) {
        revert("TODO");
    }

    function phase() external view returns (Phase) {
        revert("TODO");
    }

    function sealBid(uint256, bytes32) external view returns (bytes32) {
        revert("TODO");
    }

    function bid(bytes32) external payable {
        revert("TODO");
    }

    function reveal(uint256, bytes32) external {
        revert("TODO");
    }

    function finalize() external {
        revert("TODO");
    }

    function confirmDelivery() external {
        revert("TODO");
    }

    function withdraw() external {
        revert("TODO");
    }
}
