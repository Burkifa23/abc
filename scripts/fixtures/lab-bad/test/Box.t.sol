// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Box} from "../src/Box.sol";

contract BoxTest is Test {
    function test_Get() public {
        assertEq(new Box().get(), 42);
    }
}
