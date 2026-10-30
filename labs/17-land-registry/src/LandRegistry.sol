// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721Minimal} from "./ERC721Minimal.sol";

/// Lab 17: Immutable Land Title Registry
/// Build the contract described in README.md until `forge test` is all green.
/// Declarations are given. Do not rename anything here: the tests depend on these names.
/// ERC721Minimal is complete: read it, do not edit it.
contract LandRegistry is ERC721Minimal {
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

    address public immutable registrar;

    mapping(uint256 => Plot) private _plots; // areaSqm == 0 means "never registered"
    mapping(uint256 => address[]) private _history; // every owner, registrant first
    bool private _courtOrder; // set to true only while courtOrderTransfer is moving a title

    constructor() {
        registrar = msg.sender; // already written
    }

    function plotId(string calldata region, uint256 plotNumber) public pure returns (uint256) {
        // US1: return uint256(keccak256(abi.encode(region, plotNumber))).
        //      Use abi.encode, not encodePacked: the region is a dynamic string.
    }

    function register(string calldata region, uint256 plotNumber, uint256 areaSqm, address owner)
        external
        returns (uint256 id)
    {
        // US2: only the registrar (NotRegistrar). Revert ZeroArea() if areaSqm is 0.
        //      id = plotId(region, plotNumber). Revert AlreadyRegistered(id) if that plot already has a title.
        //      Store the Plot (not disputed), mint the token to `owner` with _mint, and emit PlotRegistered.
    }

    function plot(uint256 id) external view returns (Plot memory) {
        // US7: revert UnknownPlot(id) for a plot that was never registered (see _requirePlot), else return it.
    }

    function setDisputed(uint256 id, bool disputed) external {
        // US4: only the registrar (NotRegistrar). Revert UnknownPlot(id) for an unknown plot.
        //      Set the flag and emit DisputeSet.
    }

    function courtOrderTransfer(uint256 id, address to) external {
        // US6: only the registrar (NotRegistrar). Revert UnknownPlot(id) for an unknown plot.
        //      Move the title from its current owner to `to` with _transfer, with _courtOrder set to true while
        //      it runs (so the dispute check in _beforeTransfer is skipped), and set it back to false afterwards.
        //      The court has decided: clear the dispute flag (emit DisputeSet(id, false) if it was set).
        //      Emit CourtOrderTransfer(id, from, to).
    }

    function ownershipHistory(uint256 id) external view returns (address[] memory) {
        // US5/US7: revert UnknownPlot(id) for an unknown plot, else return every owner in order.
    }

    function _beforeTransfer(address from, address to, uint256 id) internal override {
        // US4: revert Disputed(id) if the plot is disputed and this is not a court order.
        // US5: push `to` onto the plot's history. This hook also runs when the title is first minted,
        //      so the registrant becomes the first entry.
    }

    function _requirePlot(uint256 id) internal view {
        // US7: revert UnknownPlot(id) if the plot was never registered (areaSqm == 0).
    }
}
