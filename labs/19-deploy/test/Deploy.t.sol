// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Deploy} from "../script/Deploy.s.sol";
import {Counter} from "../src/Counter.sol";

contract DeployTest is Test {
    Deploy deploy;
    address ama = makeAddr("ama");

    function setUp() public {
        deploy = new Deploy();
        // "" means unset: the script treats an empty variable as missing.
        vm.setEnv("OWNER", "");
        vm.setEnv("INITIAL_COUNT", "");
        vm.setEnv("CONFIRM_MAINNET", "");
    }

    function test_01_RunDeploys() public {
        Counter counter = deploy.run();
        assertGt(address(counter).code.length, 0);
    }

    function test_02_ReadsEnv() public {
        vm.setEnv("INITIAL_COUNT", "7");
        vm.setEnv("OWNER", vm.toString(ama));
        Counter counter = deploy.run();
        assertEq(counter.count(), 7);
        assertEq(counter.owner(), ama);
    }

    function test_03_DefaultsWithoutEnv() public {
        Counter counter = deploy.run();
        assertEq(counter.count(), 0);
        assertEq(counter.owner(), address(this)); // the caller of run() is the default owner
    }

    function test_04_CounterWorks() public {
        Counter counter = deploy.run();
        counter.increment();
        assertEq(counter.count(), 1);
    }

    function test_05_RejectsZeroOwner() public {
        vm.setEnv("OWNER", "0x0000000000000000000000000000000000000000");
        vm.expectRevert(Deploy.ZeroOwner.selector);
        deploy.run();
    }

    function test_06_WritesDeploymentFile() public {
        Counter counter = deploy.run();
        string memory json = vm.readFile("deployments/31337.json");
        assertEq(vm.parseJsonAddress(json, ".counter"), address(counter));
    }

    function test_07_MainnetGuard() public {
        vm.chainId(1);
        vm.expectRevert(Deploy.MainnetNotConfirmed.selector);
        deploy.run();

        vm.setEnv("CONFIRM_MAINNET", "yes");
        Counter counter = deploy.run();
        assertGt(address(counter).code.length, 0);
    }
}
