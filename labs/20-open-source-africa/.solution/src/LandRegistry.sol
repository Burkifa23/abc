// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721Minimal} from "./ERC721Minimal.sol";
import {ILandRegistry} from "./interfaces/ILandRegistry.sol";

/// @title LandRegistry
/// @notice One plot, one title: land maps to unique NFTs, disputes freeze transfers, history is kept.
contract LandRegistry is ERC721Minimal, ILandRegistry {
    address public immutable registrar;

    mapping(uint256 => Plot) private _plots; // areaSqm == 0 means "never registered"
    mapping(uint256 => address[]) private _history; // every owner, registrant first
    bool private _courtOrder; // true only while courtOrderTransfer is moving a title

    /// @notice The deployer becomes the registrar.
    constructor() {
        registrar = msg.sender;
    }

    /// @notice The deterministic token id of a plot.
    function plotId(string calldata region, uint256 plotNumber) public pure returns (uint256) {
        return uint256(keccak256(abi.encode(region, plotNumber)));
    }

    /// @notice Issues the title for a plot. Registrar only, and never twice for the same plot.
    function register(string calldata region, uint256 plotNumber, uint256 areaSqm, address owner)
        external
        returns (uint256 id)
    {
        if (msg.sender != registrar) revert NotRegistrar();
        if (areaSqm == 0) revert ZeroArea();
        id = plotId(region, plotNumber);
        if (_plots[id].areaSqm != 0) revert AlreadyRegistered(id);
        _plots[id] = Plot(region, plotNumber, areaSqm, false);
        _mint(owner, id);
        emit PlotRegistered(id, region, plotNumber, owner);
    }

    /// @notice The recorded details of a plot.
    function plot(uint256 id) external view returns (Plot memory) {
        _requirePlot(id);
        return _plots[id];
    }

    /// @notice Freezes or thaws a plot. Registrar only.
    function setDisputed(uint256 id, bool disputed) external {
        if (msg.sender != registrar) revert NotRegistrar();
        _requirePlot(id);
        _plots[id].disputed = disputed;
        emit DisputeSet(id, disputed);
    }

    /// @notice Reassigns a plot by court order, even when it is frozen. Registrar only.
    function courtOrderTransfer(uint256 id, address to) external {
        if (msg.sender != registrar) revert NotRegistrar();
        _requirePlot(id);
        address from = ownerOf(id);
        _courtOrder = true;
        _transfer(from, to, id);
        _courtOrder = false;
        if (_plots[id].disputed) {
            _plots[id].disputed = false;
            emit DisputeSet(id, false);
        }
        emit CourtOrderTransfer(id, from, to);
    }

    /// @notice Every owner of a plot, first to latest.
    function ownershipHistory(uint256 id) external view returns (address[] memory) {
        _requirePlot(id);
        return _history[id];
    }

    function _beforeTransfer(address, address to, uint256 id) internal override {
        if (!_courtOrder && _plots[id].disputed) revert Disputed(id);
        _history[id].push(to);
    }

    function _requirePlot(uint256 id) internal view {
        if (_plots[id].areaSqm == 0) revert UnknownPlot(id);
    }
}
