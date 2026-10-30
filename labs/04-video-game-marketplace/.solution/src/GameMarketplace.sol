// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Lab 04: Video Game Marketplace
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

    string[] private _names;
    mapping(bytes32 => uint256) private _prices; // keccak256(bytes(name)) => price
    mapping(address => mapping(bytes32 => uint256)) private _owned;

    constructor(string[] memory names, uint256[] memory prices) {
        if (names.length != prices.length) revert LengthMismatch();
        for (uint256 i = 0; i < names.length; i++) {
            if (prices[i] == 0) revert ZeroPrice(names[i]);
            _names.push(names[i]);
            _prices[keccak256(bytes(names[i]))] = prices[i];
        }
    }

    function itemCount() external view returns (uint256) {
        return _names.length;
    }

    function itemAt(uint256 i) external view returns (string memory name, uint256 price) {
        name = _names[i];
        price = _prices[keccak256(bytes(name))];
    }

    function priceOf(string calldata item) public view returns (uint256) {
        return _prices[keccak256(bytes(item))];
    }

    function inventory(address player, string calldata item) external view returns (uint256) {
        return _owned[player][keccak256(bytes(item))];
    }

    function join() external {
        if (joined[msg.sender]) revert AlreadyJoined();
        joined[msg.sender] = true;
        coins[msg.sender] = STARTING_COINS;
        emit Joined(msg.sender);
    }

    function buy(string calldata item) external {
        if (!joined[msg.sender]) revert NotJoined();
        uint256 price = priceOf(item);
        if (price == 0) revert UnknownItem(item);
        uint256 available = coins[msg.sender];
        if (available < price) revert InsufficientCoins(price, available);

        coins[msg.sender] = available - price;
        _owned[msg.sender][keccak256(bytes(item))] += 1;
        emit Bought(msg.sender, item, price);
    }

    function sell(string calldata item) external {
        bytes32 key = keccak256(bytes(item));
        if (_owned[msg.sender][key] == 0) revert NotOwned(item);

        uint256 refund = _prices[key] / 2; // the game buys back at half price, rounded down
        _owned[msg.sender][key] -= 1;
        coins[msg.sender] += refund;
        emit Sold(msg.sender, item, refund);
    }
}
