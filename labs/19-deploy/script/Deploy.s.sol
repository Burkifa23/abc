// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {Counter} from "../src/Counter.sol";

/// Lab 19: Deploy
/// Write the deploy script described in README.md until `forge test` is all green.
/// Counter is complete: you are only writing the script. Do not rename anything here: the tests depend on these names.
contract Deploy is Script {
    error ZeroOwner();
    error MainnetNotConfirmed();

    /// Reads the settings from environment variables.
    function config() public view returns (address owner, uint256 initial) {
        // TODO 1: read OWNER and INITIAL_COUNT with _env("OWNER") and _env("INITIAL_COUNT") (below). They return text,
        //         and "" means unset. vm.parseAddress(text) and vm.parseUint(text) turn the text into values.
        // TODO 2: if OWNER is unset, use msg.sender. If INITIAL_COUNT is unset, use 0.
    }

    function run() external returns (Counter counter) {
        // TODO 3: (owner, initial) = config(). Revert ZeroOwner() if owner is the zero address.
        //         This must happen BEFORE you broadcast anything.
        // TODO 4: the mainnet guard. If block.chainid == 1, revert MainnetNotConfirmed() unless _env("CONFIRM_MAINNET")
        //         is exactly "yes".
        // TODO 5: vm.startBroadcast(); counter = new Counter(owner, initial); vm.stopBroadcast();
        // TODO 6: record the deployment. json = vm.serializeAddress("deployment", "counter", address(counter));
        //         then vm.writeJson(json, _outFile());
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
