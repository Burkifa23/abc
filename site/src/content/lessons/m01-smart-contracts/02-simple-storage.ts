import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Where does a contract keep its state?", options: ["In the browser", "In a cookie", "In storage on the chain", "In your wallet"], answer: 2, explain: "State lives in on-chain storage tied to the contract's address." },
  { q: "What does `uint256 public storedData;` give you besides a variable?", options: ["A getter function", "A constructor", "An event", "Nothing"], answer: 0, explain: "The public keyword makes the compiler generate a getter." },
  { q: "Which keyword declares a contract?", options: ["class", "module", "contract", "struct"], answer: 2, explain: "Solidity uses the contract keyword." },
  { q: "Spot the bug: `function get() public returns (uint256) { return storedData; }` is meant to only read. What should be added?", options: ["pure", "view", "payable", "external"], answer: 1, explain: "A function that only reads state should be marked view." },
  { q: "What does `function set(uint256 x) public { storedData = x; }` do?", options: ["Reads x from storage", "Writes x into storage", "Deletes storedData", "Returns x"], answer: 1, explain: "The assignment writes the argument into the storage variable." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "simple-storage": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 storedData;

    // TODO: add set(uint256) and get()
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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
    ],
  },
};
