// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Lab 04: Video Game Marketplace
/// Build the contract described in README.md until `forge test` is all green.
/// Errors, events and the public state are given. You choose how to store the items.
/// Do not rename anything here: the tests depend on these names.
contract GameMarketplace {
    error LengthMismatch();
    error ZeroPrice(string item);
    error AlreadyJoined();
    error NotJoined();
    error UnknownItem(string item);
    error InsufficientCoins(uint256 needed, uint256 available);
    error NotOwned(string item);

    event Joined(address indexed player);
    event Bought(address indexed player, string item, uint256 price);
    event Sold(address indexed player, string item, uint256 refund);

    uint256 public constant STARTING_COINS = 40;

    mapping(address => uint256) public coins;
    mapping(address => bool) public joined;

    // TODO: add the storage you need for items and inventories here.
    // Hint: an array of names, plus a mapping from keccak256(bytes(name)) to price,
    // plus a nested mapping from player to item key to how many they own.

    constructor(string[] memory names, uint256[] memory prices) {
        // TODO: store the items. Revert LengthMismatch() if the arrays differ in length
        // and ZeroPrice(name) if any price is 0.
    }

    function itemCount() external view returns (uint256) {
        // TODO: how many items does the shop sell?
    }

    function itemAt(uint256 i) external view returns (string memory name, uint256 price) {
        // TODO: the i-th item's name and price.
    }

    function priceOf(string calldata item) public view returns (uint256) {
        // TODO: the price, or 0 if the item is unknown.
    }

    function inventory(address player, string calldata item) external view returns (uint256) {
        // TODO: how many of `item` the player owns.
    }

    function join() external {
        // TODO: one time per address. Give STARTING_COINS and emit Joined.
    }

    function buy(string calldata item) external {
        // TODO: the player must have joined and the item must exist.
        // They need enough coins. Charge them, add the item to their inventory, emit Bought.
    }

    function sell(string calldata item) external {
        // TODO: the player must own the item. Remove one, refund half the price (rounded down), emit Sold.
    }
}
