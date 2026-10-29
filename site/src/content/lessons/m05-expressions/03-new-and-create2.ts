import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Contract `A` contains `new B()` and contract `B` contains `new A()`. What happens?", options: ["It works; each is created lazily", "The compiler rejects it: each contract's code would have to contain the other", "It compiles but reverts at run time", "It works only if both use salts"], answer: 1, explain: "The creating contract embeds the full code of what it creates, so circular creation dependencies are impossible." },
  { q: "Which expression creates a `Club` and sends it ether at the same time?", options: ["`new Club(cap).value(1)`", "`new Club{value: 1 ether}(cap)`", "`new Club(cap, value: 1 ether)`", "`new Club(cap){value: 1 ether}`"], answer: 1, explain: "Options go in braces between the contract name and the argument list. The constructor must also be payable." },
  { q: "Spot the bug: `Club c = new Club{salt: s}(60); require(address(c) == predict(s, 50));` always reverts. Why?", options: ["`predict` must be `pure`", "The constructor argument differs, so the predicted address is different", "A salt must be `uint256`", "`require` cannot compare addresses"], answer: 1, explain: "Constructor arguments are part of what is hashed into a create2 address. Predicting with 50 and creating with 60 yields two different addresses." },
  { q: "What makes a create2 address predictable before the contract exists?", options: ["It is chosen by the caller directly", "It depends on the creator, the salt, the creation code and the constructor arguments, not on a running counter", "It is always the same for every factory", "It is derived from `block.timestamp`"], answer: 1, explain: "All four inputs are known in advance, and nothing that changes over time (such as the creator's nonce) is included." },
  { q: "What type is the salt in `new Club{salt: s}(cap)`?", options: ["`uint8`", "`string`", "`bytes32`", "`address`"], answer: 2, explain: "The salt option is a bytes32 value." },
  { q: "You run `new Club{salt: s}(10)` twice from the same factory with the same `s`. What happens to the second call?", options: ["It succeeds and returns the same contract", "It creates a second contract at the next address", "It fails, because the target address is already occupied", "It overwrites the first contract"], answer: 2, explain: "The address is fully determined by the inputs, which have not changed, so it is already taken and the creation fails." },
  { q: "A contract is re-created at the same create2 address. Which statement is true?", options: ["Its deployed bytecode must be identical", "Its deployed bytecode can differ if the constructor reads outside state that changed in between", "The new contract inherits the old storage", "The creation always reverts"], answer: 1, explain: "The creation bytecode is what the address commits to; the constructor may compute different runtime code from external data. Same address does not mean same code." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "club-factory": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Club {
    uint256 public capacity;

    constructor(uint256 cap) {
        capacity = cap;
    }
}

contract ClubFactory {
    function create(bytes32 s, uint256 cap) external returns (Club club) {
        // TODO: create the Club at an address chosen by the salt s
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Club {
    uint256 public capacity;

    constructor(uint256 cap) {
        capacity = cap;
    }
}

contract ClubFactory {
    function create(bytes32 s, uint256 cap) external returns (Club club) {
        club = new Club{salt: s}(cap);
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "ClubFactory", kind: "function", name: "create", inputs: ["bytes32", "uint256"], outputs: ["address"], stateMutability: "nonpayable", message: "create(bytes32,uint256) returns the new contract" },
      { type: "regex", pattern: "new\\s+Club\\s*\\{\\s*salt\\s*:\\s*s\\s*\\}", message: "Uses new Club{salt: s}" },
      { type: "regex", pattern: "\\}\\s*\\(\\s*cap\\s*\\)", message: "Passes cap to the constructor" },
    ],
  },
};
