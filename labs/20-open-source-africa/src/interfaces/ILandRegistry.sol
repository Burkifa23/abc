// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC721} from "./IERC721.sol";

/// Land title registry (lab 17). Constructor: `constructor()`, the deployer is the registrar.
interface ILandRegistry is IERC721 {
    struct Plot {
        string region;
        uint256 plotNumber;
        uint256 areaSqm;
        bool disputed;
    }

    error NotRegistrar();
    error AlreadyRegistered(uint256 id);
    error UnknownPlot(uint256 id);
    error Disputed(uint256 id);
    error ZeroArea();

    event PlotRegistered(uint256 indexed id, string region, uint256 plotNumber, address indexed owner);
    event DisputeSet(uint256 indexed id, bool disputed);
    event CourtOrderTransfer(uint256 indexed id, address indexed from, address indexed to);

    function registrar() external view returns (address);
    function plotId(string calldata region, uint256 plotNumber) external pure returns (uint256);
    function register(string calldata region, uint256 plotNumber, uint256 areaSqm, address owner)
        external
        returns (uint256 id);
    function plot(uint256 id) external view returns (Plot memory);
    function setDisputed(uint256 id, bool disputed) external;
    function courtOrderTransfer(uint256 id, address to) external;
    function ownershipHistory(uint256 id) external view returns (address[] memory);
}
