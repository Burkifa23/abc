// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {HelloWorld} from "../src/HelloWorld.sol";

contract HelloWorldTest is Test {
    HelloWorld hello;
    address kofi = makeAddr("kofi");

    event GreetingChanged(address indexed by, string greeting);

    function setUp() public {
        hello = new HelloWorld("Akwaaba");
    }

    function test_01_StoresInitialGreeting() public view {
        assertEq(hello.greeting(), "Akwaaba");
    }

    function test_02_DeployerIsOwner() public view {
        assertEq(hello.owner(), address(this));
    }

    function test_03_OwnerCanSetGreeting() public {
        hello.setGreeting("Hello");
        assertEq(hello.greeting(), "Hello");
    }

    function test_04_OnlyOwnerCanSet() public {
        vm.prank(kofi);
        vm.expectRevert(HelloWorld.NotOwner.selector);
        hello.setGreeting("Hello");
    }

    function test_05_EmitsGreetingChanged() public {
        vm.expectEmit(true, false, false, true);
        emit GreetingChanged(address(this), "Hello");
        hello.setGreeting("Hello");
    }

    function test_06_GreetsByName() public view {
        assertEq(hello.greet("Ama"), "Akwaaba, Ama!");
    }

    function test_07_RejectsEmptyGreeting() public {
        vm.expectRevert(HelloWorld.EmptyGreeting.selector);
        hello.setGreeting("");
    }
}
