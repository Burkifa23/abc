// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Lab 01: Hello Foundry
/// Fill in every TODO until `forge test` is all green.
/// Do not rename anything here: the tests depend on these names.
contract HelloWorld {
    // An "error" is a named way to stop a transaction. Callers see its name.
    error NotOwner();
    error EmptyGreeting();

    // An "event" is a log line that apps can listen for.
    event GreetingChanged(address indexed by, string greeting);

    // A "state variable" lives on the blockchain between calls.
    string public greeting;
    address public immutable owner;

    constructor(string memory initial) {
        // TODO 1: save `initial` into the state variable `greeting` (use `=`).
        // TODO 2: read the next line. `msg.sender` is whoever deployed the contract.
        //         It is already written for you, because `immutable` must be set here.
        owner = msg.sender;
    }

    function setGreeting(string calldata newGreeting) external {
        // TODO 3: stop non-owners. Use: if (msg.sender != owner) revert NotOwner();
        // TODO 4: stop empty text. Use: if (bytes(newGreeting).length == 0) revert EmptyGreeting();
        // TODO 5: save `newGreeting` into `greeting`, then `emit GreetingChanged(msg.sender, newGreeting);`
    }

    function greet(string calldata name) external view returns (string memory) {
        // TODO 6: return the greeting, a comma and space, the name, and "!".
        //         Use: return string.concat(greeting, ", ", name, "!");
    }
}
