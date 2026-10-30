// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Lab 01: Hello Foundry
contract HelloWorld {
    error NotOwner();
    error EmptyGreeting();

    event GreetingChanged(address indexed by, string greeting);

    string public greeting;
    address public immutable owner;

    constructor(string memory initial) {
        greeting = initial;
        owner = msg.sender;
    }

    function setGreeting(string calldata newGreeting) external {
        if (msg.sender != owner) revert NotOwner();
        if (bytes(newGreeting).length == 0) revert EmptyGreeting();
        greeting = newGreeting;
        emit GreetingChanged(msg.sender, newGreeting);
    }

    function greet(string calldata name) external view returns (string memory) {
        return string.concat(greeting, ", ", name, "!");
    }
}
