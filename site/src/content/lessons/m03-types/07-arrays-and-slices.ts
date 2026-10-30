import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "What does `uint256[][5]` declare?", options: ["A dynamic array of five-item arrays", "Five dynamic arrays of uint256", "A 5x5 grid", "A compile error"], answer: 1, explain: "The size nearest the name is the outer one, so this is a fixed array of 5 items, each a dynamic uint256[]." },
  { q: "```solidity\nuint256[] memory a = new uint256[](3);\na.push(4);\n```\nWhat happens?", options: ["It does not compile; memory arrays have no push", "`a` grows to length 4 and the old items are copied across", "It writes the new item into storage instead of memory", "It reverts when the line runs, since memory cannot grow"], answer: 0, explain: "push and pop exist only for dynamic storage arrays and storage bytes. Memory arrays keep the length they were created with." },
  { q: "Why does `string` have no `length` or `s[i]`?", options: ["It is stored in calldata only, and indexing there is disabled", "Strings are always empty until the first character is pushed to them", "UTF-8 characters can span several bytes, so indexing would mislead", "It is an old bug that was never fixed in the compiler"], answer: 2, explain: "Convert with `bytes(s)` when you really want byte-level length or access." },
  { q: "```solidity\nuint256[3] memory p = [10, 20, 300];\n```\nWhy does this fail?", options: ["Array literals cannot be assigned to memory variables at all, only to storage", "Three items is too few for a memory array literal", "`uint256` cannot be used as a memory array element type", "The literal's type is uint16[3] (the smallest type for all items), which does not convert to uint256[3]"], answer: 3, explain: "An array literal takes the smallest type that fits every item, here uint16. Fixed arrays with different element types never convert, so write [uint256(10), 20, 300]." },
  { q: "Spot the bug:\n```solidity\nuint256[][] byWeek;\nfunction f() public {\n    byWeek.push();\n    uint256[] storage d0 = byWeek[0];\n    byWeek.pop();\n    d0.push(1);\n}\n```", options: ["`d0` is a dangling reference after `pop`", "`push()` needs an argument", "`byWeek[0]` is out of range", "Nothing is wrong"], answer: 0, explain: "After pop, the inner array no longer belongs to byWeek, but `d0` still points at its slot, so the write lands in storage nothing owns." },
  { q: "Where can the slice `data[4:]` be used?", options: ["On any array", "On storage arrays only", "Only on calldata arrays", "Only on fixed-size arrays"], answer: 2, explain: "Slices are windows onto calldata, which is read-only and already in the call. Storage and memory arrays have no slice syntax." },
  { q: "What does `list.push()` with no argument do on a dynamic storage array?", options: ["Removes the last item and returns it to the caller", "Does nothing, because push needs an argument", "Reduces the length by one without clearing the slot", "Appends a zero item and returns a reference to it"], answer: 3, explain: "It adds a zeroed item, and the returned reference lets you fill it in, e.g. `list.push().year = 1;`." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "scoreboard-arrays": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Scoreboard {
    uint256[] scores;

    // TODO: append s to scores
    function add(uint256 s) external {}

    // TODO: drop the newest score
    function removeLast() external {}

    // TODO: return how many scores are stored
    function count() external view returns (uint256) {}

    // TODO: return data without its first 4 bytes, using a calldata slice
    function stripSelector(bytes calldata data) external pure returns (bytes memory) {}
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Scoreboard {
    uint256[] scores;

    function add(uint256 s) external {
        scores.push(s);
    }

    function removeLast() external {
        scores.pop();
    }

    function count() external view returns (uint256) {
        return scores.length;
    }

    function stripSelector(bytes calldata data) external pure returns (bytes memory) {
        return data[4:];
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "Scoreboard", kind: "function", name: "add", inputs: ["uint256"], stateMutability: "nonpayable", message: "Has add(uint256)" },
      { type: "abi", contract: "Scoreboard", kind: "function", name: "removeLast", inputs: [], stateMutability: "nonpayable", message: "Has removeLast()" },
      { type: "abi", contract: "Scoreboard", kind: "function", name: "count", inputs: [], outputs: ["uint256"], stateMutability: "view", message: "Has view count() returning uint256" },
      { type: "abi", contract: "Scoreboard", kind: "function", name: "stripSelector", inputs: ["bytes"], outputs: ["bytes"], stateMutability: "pure", message: "Has pure stripSelector(bytes) returning bytes" },
      { type: "regex", pattern: "scores\\s*\\.\\s*push\\s*\\(\\s*s\\s*\\)", message: "add uses push(s)" },
      { type: "regex", pattern: "scores\\s*\\.\\s*pop\\s*\\(\\s*\\)", message: "removeLast uses pop()" },
      { type: "regex", pattern: "scores\\s*\\.\\s*length", message: "count reads length" },
      { type: "regex", pattern: "data\\s*\\[\\s*4\\s*:\\s*\\]", message: "stripSelector slices data[4:]" },
    ],
  },
};
