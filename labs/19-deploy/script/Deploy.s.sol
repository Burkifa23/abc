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
        // TODO 1: read OWNER (an address) and INITIAL_COUNT (a number) from the environment.
        //         Hint: vm.envOr("NAME", string("")) returns "" when the variable is unset. Tests also set a variable to ""
        //         to "unset" it, so treat an empty string as unset.
        //         vm.parseAddress(text) and vm.parseUint(text) turn the text into values.
        // TODO 2: if OWNER is unset, use msg.sender. If INITIAL_COUNT is unset, use 0.
    }

    function run() external returns (Counter counter) {
        // TODO 3: (owner, initial) = config(). Revert ZeroOwner() if owner is the zero address.
        //         This must happen BEFORE you broadcast anything.
        // TODO 4: the mainnet guard. If block.chainid == 1, revert MainnetNotConfirmed() unless the CONFIRM_MAINNET
        //         environment variable is exactly "yes".
        // TODO 5: vm.startBroadcast(); counter = new Counter(owner, initial); vm.stopBroadcast();
        // TODO 6: record the deployment. json = vm.serializeAddress("deployment", "counter", address(counter));
        //         then vm.writeJson(json, string.concat("./deployments/", vm.toString(block.chainid), ".json"));
    }
}
