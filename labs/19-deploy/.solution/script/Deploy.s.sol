// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {Counter} from "../src/Counter.sol";

/// Facilitator reference. Learners: try first, peek later.
contract Deploy is Script {
    error ZeroOwner();
    error MainnetNotConfirmed();

    /// OWNER (default: the account running the script) and INITIAL_COUNT (default 0).
    /// An empty variable counts as unset.
    function config() public view returns (address owner, uint256 initial) {
        string memory rawOwner = _env("OWNER");
        owner = bytes(rawOwner).length == 0 ? msg.sender : vm.parseAddress(rawOwner);
        string memory rawInitial = _env("INITIAL_COUNT");
        initial = bytes(rawInitial).length == 0 ? 0 : vm.parseUint(rawInitial);
    }

    function run() external returns (Counter counter) {
        (address owner, uint256 initial) = config();
        // Guards come first: refuse before anything is broadcast.
        if (owner == address(0)) revert ZeroOwner();
        if (block.chainid == 1 && keccak256(bytes(_env("CONFIRM_MAINNET"))) != keccak256("yes")) {
            revert MainnetNotConfirmed();
        }

        vm.startBroadcast();
        counter = new Counter(owner, initial);
        vm.stopBroadcast();

        // Record where it went, so a frontend can find it.
        string memory json = vm.serializeAddress("deployment", "counter", address(counter));
        vm.writeJson(json, _outFile());
    }

    /// Where the settings come from: the process environment. "" means unset. Given.
    /// The tests replace this function, so tests running in parallel do not share one environment.
    function _env(string memory name) internal view virtual returns (string memory) {
        return vm.envOr(name, string(""));
    }

    /// Where the deployment is recorded: deployments/<chainid>.json. Given. The tests give each test its own file.
    function _outFile() internal view virtual returns (string memory) {
        return string.concat("./deployments/", vm.toString(block.chainid), ".json");
    }
}
