import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { "q":"Which of these builds a `Member` correctly (fields: name, year, feePaid)?","options":["`Member(\"Ama\", 2)`", "`Member({ name: \"Ama\", year: 2, feePaid: false })`", "`new Member({ name: \"Ama\", year: 2, feePaid: false })`", "`Member[\"Ama\", 2, false]`"], "answer":1,"explain":"All fields are required, either in order or by name inside braces. `new` is for contracts and arrays, not structs." },
  { "q":"A struct has a `mapping` field. Where can an instance of it live?","options":["Memory or storage","Calldata only","Anywhere except storage","Storage only"],"answer":3,"explain":"Mappings exist only in storage, so a struct that holds one cannot be created in memory." },
  { "q":"```solidity\nMember memory m = members[i];\nm.feePaid = true;\n```\nWhat is the effect on `members[i]`?","options":["No change; `m` is a copy","`feePaid` becomes true","The transaction reverts","The array shrinks"],"answer":0,"explain":"Storage to memory copies. Use `Member storage m` to update the original." },
  { "q":"Spot the bug:\n```solidity\nstruct Node {\n    uint256 value;\n    Node next;\n}\n```","options":["`uint256` is not allowed as a struct member type", "`Node` must be declared inside a contract, not at file level", "A struct cannot directly contain its own type", "Nothing is wrong with the declaration"], "answer":2,"explain":"It would be infinitely large. Refer to other nodes by id, using a dynamic array or a mapping of Node." },
  { "q":"When a struct holding a mapping is copied into a storage variable, what happens to the mapping part?","options":["It is copied key by key","It is skipped","It is deleted","The copy reverts"],"answer":1,"explain":"The ordinary fields are copied but the mapping is left alone, since its keys are not known." },
  { "q":"What does the automatic getter of a public struct variable leave out?","options":["Strings","Integers","Array and mapping members","Booleans"],"answer":2,"explain":"Arrays and mappings inside a struct are not returned by the generated getter." },
  { "q":"```solidity\nFund storage f = funds[7];\nf.raised += 1;\n```\nIf nobody ever wrote to `funds[7]`, what happens?","options":["It reverts because the key is missing", "It creates a memory copy", "It works on a Fund of zero values", "It does not compile"], "answer":2,"explain":"Every key of a mapping reads as the zero value of its type, so a Fund of zeros is there and the write fills it." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "fundraiser-struct": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Fundraiser {
    struct Fund {
        address owner;
        uint256 goal;
        uint256 raised;
        // TODO: add mapping(address => uint256) pledged;
    }

    mapping(uint256 => Fund) funds;
    uint256 nextFund;

    // TODO: take a storage pointer to a new fund, set owner and goal, return its id
    function open(uint256 goal) external returns (uint256 id) {}

    // TODO: add msg.value to the fund total and to the caller's pledged entry
    function pledge(uint256 id) external payable {}
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Fundraiser {
    struct Fund {
        address owner;
        uint256 goal;
        uint256 raised;
        mapping(address => uint256) pledged;
    }

    mapping(uint256 => Fund) funds;
    uint256 nextFund;

    function open(uint256 goal) external returns (uint256 id) {
        id = nextFund++;
        Fund storage f = funds[id];
        f.owner = msg.sender;
        f.goal = goal;
    }

    function pledge(uint256 id) external payable {
        Fund storage f = funds[id];
        f.raised += msg.value;
        f.pledged[msg.sender] += msg.value;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "Fundraiser", kind: "function", name: "open", inputs: ["uint256"], outputs: ["uint256"], stateMutability: "nonpayable", message: "Has open(uint256) returning uint256" },
      { type: "abi", contract: "Fundraiser", kind: "function", name: "pledge", inputs: ["uint256"], stateMutability: "payable", message: "Has payable pledge(uint256)" },
      { type: "regex", pattern: "mapping\\s*\\(\\s*address\\s*=>\\s*uint256\\s*\\)\\s+pledged\\s*;", message: "Fund has a pledged mapping(address => uint256)" },
      { type: "regex", pattern: "Fund\\s+storage\\s+\\w+\\s*=\\s*funds\\s*\\[", message: "Uses a storage pointer to funds[...]" },
      { type: "regex", pattern: "\\.owner\\s*=\\s*msg\\.sender", message: "open records msg.sender as owner" },
      { type: "regex", pattern: "\\.pledged\\s*\\[\\s*msg\\.sender\\s*\\]\\s*\\+=\\s*msg\\.value", message: "pledge records the caller's amount" },
    ],
  },
};
