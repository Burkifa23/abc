import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "What is a Solidity contract, as this lesson defines it?", options: ["A legal document stored as text", "Code and data that live together at one address on the blockchain", "A JavaScript file that runs in your browser", "A list of every transaction in the network"], answer: 1, explain: "A contract bundles functions (code) and state (data) at a specific address on the chain." },
  { q: "What does `uint256 public room;` give you besides the variable itself?", options: ["A generated function `room()` that returns the value", "A constructor", "Protection from being overwritten", "An event whenever it changes"], answer: 0, explain: "The public keyword makes the compiler create a getter function with the same name. It does not restrict who can change the value." },
  { q: "Spot the bug: `function current() public returns (uint256) { return room; }` is meant to be a free read. What is missing?", options: ["`payable`", "`pure`", "`external`", "`view`"], answer: 3, explain: "A function that only reads state should be marked view so it can be called without a transaction. The compiler also warns about it." },
  { q: "What does `pragma solidity ^0.8.24;` accept?", options: ["Only 0.8.24 exactly", "0.8.24 and later 0.8.x versions, but not 0.9.0", "Any version 0.8.24 or higher, even 1.0.0", "Any version below 0.8.24"], answer: 1, explain: "The caret means compatible changes only: later patch releases of 0.8, but nothing from 0.9.0 upward." },
  { q: "Given `function announce(uint256 newRoom) public { room = newRoom; }`, what happens when Kofi calls it right after Ama did?", options: ["It reverts because the cell is already set", "It writes his number next to hers", "It overwrites the stored value; Ama's value remains only in the chain's history", "It deletes the contract"], answer: 2, explain: "Nothing restricts the caller, so the new value replaces the old one in state. Past transactions stay recorded in the history." },
  { q: "Inside the contract, how should you read the state variable `room`?", options: ["With the bare name `room`", "With `this.room`, which is just a style choice", "With `self.room`", "Only through another contract"], answer: 0, explain: "The bare name accesses the member directly. `this.room` would be a different mechanism (an external call), not a stylistic variant." },
  { q: "What is the value of `room` right after the contract is created, before anyone calls `announce`?", options: ["It is undefined and reading it reverts", "The address of the creator", "Whatever the compiler picks", "Zero"], answer: 3, explain: "Uninitialised state variables start at the default value for their type, which is zero for integers." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "simple-storage": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SimpleStorage {
    uint256 storedData;

    // TODO: add set(uint256) that stores a value
    // TODO: add get() that returns it (and promises not to change state)
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SimpleStorage {
    uint256 storedData;

    function set(uint256 x) public {
        storedData = x;
    }

    function get() public view returns (uint256) {
        return storedData;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "SimpleStorage", kind: "function", name: "set", inputs: ["uint256"], stateMutability: "nonpayable", message: "Has set(uint256) that changes state" },
      { type: "abi", contract: "SimpleStorage", kind: "function", name: "get", inputs: [], outputs: ["uint256"], stateMutability: "view", message: "Has view get() returning uint256" },
      { type: "regex", pattern: "\\bstoredData\\s*=\\s*\\w+\\s*;", message: "set assigns the argument to storedData" },
      { type: "regex", pattern: "return\\s+storedData\\s*;", message: "get returns storedData" },
    ],
  },
};
