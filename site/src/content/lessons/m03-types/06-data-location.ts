import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Which data location is read-only and holds the arguments of an external call?", options: ["`storage`", "`memory`", "`calldata`", "`stack`"], answer: 2, explain: "calldata is the immutable input area of the call. Using it avoids copying arguments." },
  { q: "```solidity\nStudent memory s = students[i];\ns.year += 1;\n```\nWhat is the effect on the contract's stored data?", options: ["`students[i].year` goes up by one", "Nothing; only a copy was changed", "The transaction reverts", "All students are updated"], answer: 1, explain: "Assigning from storage to a memory variable makes a copy, so the stored struct is untouched." },
  { q: "What does `Student storage s = students[i];` create?", options: ["A copy of the struct", "A pointer (alias) to the stored struct", "A new empty struct", "A calldata view"], answer: 1, explain: "A local storage variable references the original data; edits through `s` change the state." },
  { q: "Which assignment always makes a copy?", options: ["memory to memory", "storage to a local storage variable", "anything to a state variable", "none of them do"], answer: 2, explain: "Assigning into a state variable copies the data into the contract's storage. Memory-to-memory and local storage pointers share." },
  { q: "Spot the bug: `function total(uint256[] storage xs) external pure returns (uint256)`. What is wrong?", options: ["Nothing", "`external` functions cannot take a `storage` parameter", "`pure` needs `memory`", "Arrays cannot be summed"], answer: 1, explain: "Storage parameters are only for internal or private functions (and libraries). An external function receives its input in calldata or memory." },
  { q: "Why is `uint256[] calldata` usually better than `uint256[] memory` for a read-only external function?", options: ["Calldata arrays can be resized", "The data is not copied into memory, which saves gas", "Calldata is writable", "Memory is not allowed for external functions"], answer: 1, explain: "Calldata is read in place. A memory parameter copies every element first." },
  { q: "```solidity\nuint256[] memory a = new uint256[](3);\na.push(1);\n```\nWhat happens?", options: ["`a` becomes length 4", "It does not compile; memory arrays have a fixed length", "It reverts at runtime", "It writes to storage"], answer: 1, explain: "Memory arrays cannot change size after creation. `push` exists only for dynamic storage arrays." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "roster-locations": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Roster {
    struct Student { string name; uint16 year; }
    Student[] students;

    function enroll(string calldata name) public {
        students.push(Student(name, 1));
    }

    // TODO: external pure sum(uint256[] ...) returns (uint256) - adds the elements, never changes them
    // TODO: public pure bump(uint256[] ...) returns (uint256[] memory) - adds 1 to each element of a copy
    // TODO: public promote(uint256 i) - adds 1 to students[i].year in the contract's data
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Roster {
    struct Student { string name; uint16 year; }
    Student[] students;

    function enroll(string calldata name) public {
        students.push(Student(name, 1));
    }

    function sum(uint256[] calldata xs) external pure returns (uint256 total) {
        for (uint256 i = 0; i < xs.length; i++) {
            total += xs[i];
        }
    }

    function bump(uint256[] memory xs) public pure returns (uint256[] memory) {
        for (uint256 i = 0; i < xs.length; i++) {
            xs[i] += 1;
        }
        return xs;
    }

    function promote(uint256 i) public {
        Student storage s = students[i];
        s.year += 1;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "noWarnings" },
      { type: "abi", contract: "Roster", kind: "function", name: "sum", inputs: ["uint256[]"], outputs: ["uint256"], stateMutability: "pure", message: "Has pure sum(uint256[]) returning uint256" },
      { type: "abi", contract: "Roster", kind: "function", name: "bump", inputs: ["uint256[]"], outputs: ["uint256[]"], stateMutability: "pure", message: "Has pure bump(uint256[]) returning uint256[]" },
      { type: "abi", contract: "Roster", kind: "function", name: "promote", inputs: ["uint256"], stateMutability: "nonpayable", message: "Has promote(uint256) that changes state" },
      { type: "regex", pattern: "sum\\s*\\(\\s*uint256\\[\\]\\s+calldata", message: "sum reads its array from calldata" },
      { type: "regex", pattern: "bump\\s*\\(\\s*uint256\\[\\]\\s+memory", message: "bump works on a memory copy" },
      { type: "regex", pattern: "Student\\s+storage\\s+\\w+\\s*=\\s*students\\s*\\[", message: "promote takes a storage pointer to students[i]" },
    ],
  },
};
