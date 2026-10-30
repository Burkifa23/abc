// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721Minimal} from "./ERC721Minimal.sol";

/// Facilitator reference. Learners: try first, peek later.
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
    bool private _courtOrder; // true only while courtOrderTransfer is moving a title

    constructor() {
        registrar = msg.sender;
    }

    function plotId(string calldata region, uint256 plotNumber) public pure returns (uint256) {
        return uint256(keccak256(abi.encode(region, plotNumber)));
    }

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

    function plot(uint256 id) external view returns (Plot memory) {
        _requirePlot(id);
        return _plots[id];
    }

    function setDisputed(uint256 id, bool disputed) external {
        if (msg.sender != registrar) revert NotRegistrar();
        _requirePlot(id);
        _plots[id].disputed = disputed;
        emit DisputeSet(id, disputed);
    }

    function courtOrderTransfer(uint256 id, address to) external {
        if (msg.sender != registrar) revert NotRegistrar();
        _requirePlot(id);
        address from = ownerOf(id);
        _courtOrder = true;
        _transfer(from, to, id);
        _courtOrder = false;
        if (_plots[id].disputed) {
            _plots[id].disputed = false; // the court has decided
            emit DisputeSet(id, false);
        }
        emit CourtOrderTransfer(id, from, to);
    }

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
