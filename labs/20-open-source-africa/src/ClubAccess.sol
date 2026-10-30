// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IClubAccess} from "./interfaces/IClubAccess.sol";

/// @title ClubAccess
/// @notice Members prove they know a secret without revealing it up front (commit, then reveal).
/// Starter: every function reverts "TODO". Bring over your lab 11 solution, then polish it
/// (NatSpec, formatting, coverage). The interface is in src/interfaces/IClubAccess.sol.
/// You may replace a getter function with a `public` state variable or mapping of the same name.
contract ClubAccess is IClubAccess {
    /// @notice The deployer becomes the admin.
    constructor() {
        revert("TODO");
    }

    function admin() external view returns (address) {
        revert("TODO");
    }

    function isMember(bytes32) external view returns (bool) {
        revert("TODO");
    }

    function used(bytes32) external view returns (bool) {
        revert("TODO");
    }

    function sealedEntry(address) external view returns (bytes32) {
        revert("TODO");
    }

    function committedAt(address) external view returns (uint256) {
        revert("TODO");
    }

    function hasAccess(address) external view returns (bool) {
        revert("TODO");
    }

    function commitmentOf(bytes32) external pure returns (bytes32) {
        revert("TODO");
    }

    function sealFor(address, bytes32) external pure returns (bytes32) {
        revert("TODO");
    }

    function addMember(bytes32) external {
        revert("TODO");
    }

    function revokeMember(bytes32) external {
        revert("TODO");
    }

    function commitEntry(bytes32) external {
        revert("TODO");
    }

    function enter(bytes32) external {
        revert("TODO");
    }
}
