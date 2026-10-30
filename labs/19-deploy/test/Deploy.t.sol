// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Deploy} from "../script/Deploy.s.sol";
import {Counter} from "../src/Counter.sol";

/// The real script reads the process environment, which every test in a run shares (and forge runs tests in
/// parallel). So the tests use this copy: its "environment" and output file belong to one test only.
contract TestDeploy is Deploy {
    mapping(bytes32 => string) private _fake;
    string private _tag;

    constructor(string memory tag) {
        _tag = tag;
    }

    function set(string calldata name, string calldata value) external {
        _fake[keccak256(bytes(name))] = value;
    }

    function _env(string memory name) internal view override returns (string memory) {
        return _fake[keccak256(bytes(name))];
    }

    function _outFile() internal view override returns (string memory) {
        return string.concat("./deployments/", _tag, "-", vm.toString(block.chainid), ".json");
    }
}

contract DeployTest is Test {
    address ama = makeAddr("ama");

    // Every test starts from an empty environment: nothing is set until the test sets it.

    function test_01_RunDeploys() public {
        TestDeploy deploy = new TestDeploy("t01");
        Counter counter = deploy.run();
        assertGt(address(counter).code.length, 0);
    }

    function test_02_ReadsEnv() public {
        TestDeploy deploy = new TestDeploy("t02");
        deploy.set("INITIAL_COUNT", "7");
        deploy.set("OWNER", vm.toString(ama));
        Counter counter = deploy.run();
        assertEq(counter.count(), 7);
        assertEq(counter.owner(), ama);
    }

    function test_03_DefaultsWithoutEnv() public {
        TestDeploy deploy = new TestDeploy("t03");
        deploy.set("INITIAL_COUNT", ""); // "" is the same as unset
        Counter counter = deploy.run();
        assertEq(counter.count(), 0);
        assertEq(counter.owner(), address(this)); // the caller of run() is the default owner
    }

    function test_04_CounterWorks() public {
        TestDeploy deploy = new TestDeploy("t04");
        Counter counter = deploy.run();
        counter.increment();
        assertEq(counter.count(), 1);
    }

    function test_05_RejectsZeroOwner() public {
        TestDeploy deploy = new TestDeploy("t05");
        deploy.set("OWNER", "0x0000000000000000000000000000000000000000");
        vm.expectRevert(Deploy.ZeroOwner.selector);
        deploy.run();
    }

    function test_06_WritesDeploymentFile() public {
        TestDeploy deploy = new TestDeploy("t06");
        Counter counter = deploy.run();
        string memory json = vm.readFile("deployments/t06-31337.json");
        assertEq(vm.parseJsonAddress(json, ".counter"), address(counter));
    }

    function test_07_MainnetGuard() public {
        TestDeploy deploy = new TestDeploy("t07");
        vm.chainId(1);
        vm.expectRevert(Deploy.MainnetNotConfirmed.selector);
        deploy.run();

        deploy.set("CONFIRM_MAINNET", "yes");
        Counter counter = deploy.run();
        assertGt(address(counter).code.length, 0);
    }
}
