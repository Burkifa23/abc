// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// A tiny contract to deploy. It is complete: this lab is about shipping it, not writing it.
contract Counter {
    address public immutable owner;
    uint256 public count;

    constructor(address owner_, uint256 initial) {
        owner = owner_;
        count = initial;
    }

    function increment() external {
        count += 1;
    }
}
