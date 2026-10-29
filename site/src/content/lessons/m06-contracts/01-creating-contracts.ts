import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "How many times does a contract's constructor run?", options: ["Once, when the contract is created", "Every time someone sends it ether", "Once per transaction that touches the contract", "Each time the owner restarts it from the dashboard"], answer: 0, explain: "The constructor belongs to the creation step only. After deployment its code is not part of the stored runtime code, so it cannot run again." },
  { q: "What is stored on the blockchain at the contract's address after creation succeeds?", options: ["The complete creation code, including the constructor and its helpers", "The runtime code: the public and external functions plus what they reach", "Only the original source file, which each node compiles again on demand", "Just the constructor arguments, kept as a permanent record of how it began"], answer: 1, explain: "The creation code runs once and returns the runtime code, which is what gets stored. Constructor-only code is left out." },
  { q: "A factory runs `new Club(name)` and `Club`'s constructor sets `president = msg.sender;`. Who becomes president?", options: ["The student who sent the transaction to the factory", "Nobody, because the constructor reverts", "The factory contract that executed `new`", "The address zero, until someone claims the role"], answer: 2, explain: "Inside a constructor, msg.sender is whoever creates the contract. With `new`, that is the calling contract, not the person behind the outer transaction." },
  { q: "Spot the bug: `constructor() { sizeSeen = this.measure(); }` where `measure` is an `external` function of the same contract. Why is it a problem?", options: ["Constructors are not allowed to read any function results at all", "`this.measure()` makes an external call to an address with no code yet", "The constructor has to be marked `external` before it may call `measure`", "`measure` can only ever be called by tools that sit outside the blockchain"], answer: 1, explain: "While the constructor runs, no runtime code is stored at the address, so an external call to it (this.f()) cannot work. Calling an internal function directly is fine." },
  { q: "Which statement about contracts that create each other is correct?", options: ["Two contracts can create each other if both use `create2`", "It works when the creator is deployed first and the other is patched in later", "Only the first contract in the file may use `new`", "It is impossible, because the creator must contain the created contract's code"], answer: 3, explain: "The creating contract embeds the created contract's creation code, so a cycle would need each to contain the other." },
  { q: "Which of these is the limit on the runtime code of a deployed contract?", options: ["24,576 bytes (EIP-170)", "49,152 bytes (EIP-170)", "One megabyte per contract", "There is no limit, only a gas cost per byte"], answer: 0, explain: "EIP-170 caps deployed code at 24 KiB. EIP-3860 separately caps initcode at 48 KiB." },
  { q: "How does a contract with `constructor(uint256 fee_)` receive its argument when deployed by a script?", options: ["Through a function called `init` that the script must call next", "The compiler reads it from an environment variable", "The ABI-encoded argument is appended after the creation code", "It is written into the contract's first storage slot by the network"], answer: 2, explain: "Constructor arguments are ABI encoded and attached after the creation code. Deployment tools do this automatically." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "constructor-owner": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Society {
    address public owner;
    string public name;

    // TODO: add a constructor that takes the society's name (string memory),
    // stores it in \`name\`, and records the deployer as \`owner\`
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Society {
    address public owner;
    string public name;

    constructor(string memory name_) {
        owner = msg.sender;
        name = name_;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "Society", kind: "function", name: "owner", inputs: [], outputs: ["address"], stateMutability: "view", message: "Has a public owner() getter" },
      { type: "abi", contract: "Society", kind: "function", name: "name", inputs: [], outputs: ["string"], stateMutability: "view", message: "Has a public name() getter" },
      { type: "regex", pattern: "constructor\\s*\\(\\s*string\\s+memory\\s+\\w+\\s*\\)", message: "The constructor takes one string memory argument" },
      { type: "regex", pattern: "\\bowner\\s*=\\s*msg\\.sender\\s*;", message: "The constructor records msg.sender as owner" },
      { type: "regex", pattern: "\\bname\\s*=\\s*\\w+\\s*;", message: "The constructor stores the name argument" },
    ],
  },
};
