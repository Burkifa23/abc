// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721Minimal} from "./ERC721Minimal.sol";
import {ILandRegistry} from "./interfaces/ILandRegistry.sol";

/// @title LandRegistry
/// @notice One plot, one title: land maps to unique NFTs, disputes freeze transfers, history is kept.
/// Starter: every registry function reverts "TODO". Bring over your lab 17 solution, then polish it
/// (NatSpec, formatting, coverage). The interface is in src/interfaces/ILandRegistry.sol.
/// ERC721Minimal (complete) provides the ERC-721 functions; override its `_beforeTransfer` hook.
/// You may replace `registrar()` with a `public immutable address registrar`.
contract LandRegistry is ERC721Minimal, ILandRegistry {
    /// @notice The deployer becomes the registrar.
    constructor() {
        revert("TODO");
    }

    function registrar() external view returns (address) {
        revert("TODO");
    }

    function plotId(string calldata, uint256) external pure returns (uint256) {
        revert("TODO");
    }

    function register(string calldata, uint256, uint256, address) external returns (uint256) {
        revert("TODO");
    }

    function plot(uint256) external view returns (Plot memory) {
        revert("TODO");
    }

    function setDisputed(uint256, bool) external {
        revert("TODO");
    }

    function courtOrderTransfer(uint256, address) external {
        revert("TODO");
    }

    function ownershipHistory(uint256) external view returns (address[] memory) {
        revert("TODO");
    }
}
