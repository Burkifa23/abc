import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { "q":"```solidity\nuint256 a = 5;\nuint256 x = a++;\n```\nWhat are `a` and `x`?","options":["a = 6, x = 5","a = 6, x = 6","a = 5, x = 6","a = 5, x = 5"],"answer":0,"explain":"Postfix `a++` yields the old value (5) and then increments `a`. `++a` would give x = 6." },
  { "q":"What does `delete arr[2]` do to a dynamic array of length 5?","options":["Removes the item and shifts the rest left","Sets item 2 to zero; length stays 5","Sets the length to 2","Reverts"],"answer":1,"explain":"`delete` on an element only resets that element to its default and leaves a gap." },
  { "q":"How is `flags & MASK == MASK` grouped in Solidity?","options":["`flags & (MASK == MASK)`","It does not compile","`(flags & MASK) == MASK`","Left to right with equal precedence"],"answer":2,"explain":"`&` is level 7 and `==` is level 11, so the AND is done first. In C it is the other way round." },
  { "q":"What is `2 ** 3 ** 2`?","options":["64","512","36","It does not compile"],"answer":1,"explain":"`**` is right-associative: 3 ** 2 = 9 first, then 2 ** 9 = 512." },
  { "q":"```solidity\nuint256 total = 10;\nuint256 copy = total;\ndelete total;\n```\nWhat is `copy` afterwards?","options":["0","It reverts","Undefined","10"],"answer":3,"explain":"`copy` is a value copy. Deleting `total` resets only `total`." },
  { "q":"Spot the bug: `0.25 * (vip ? 4 : 8)` is rejected while `0.25 * 4` is accepted. Why?","options":["Fractions are never allowed","`vip` must be a constant","The ternary forces a real type for the fractional literal, which has none","Multiplication cannot take a ternary as an operand"],"answer":2,"explain":"Pure literal arithmetic is evaluated exactly at compile time. A ternary needs a concrete result type, and a fraction has none." },
  { "q":"What does `delete someMapping[key]` do?","options":["Resets that single entry to the zero value","Removes the whole mapping","Does nothing","Does not compile"],"answer":0,"explain":"A whole mapping cannot be deleted because its keys are unknown, but one entry can be reset. Nothing is physically removed; it reads as zero." },
  { "q":"In `1 << 2 + 1`, what is evaluated first?","options":["`1 << 2`","`2 + 1`","Neither; the line is invalid","They are evaluated together"],"answer":1,"explain":"Addition (level 5) is tighter than shifts (level 6), so this is `1 << 3`, which is 8." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "tally-operators": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Tally {
    uint256 public total;

    // TODO: return "pass" when mark >= 50, otherwise "fail", using a ternary
    function label(uint256 mark) external pure returns (string memory) {}

    // TODO: add n to total using a compound assignment
    function add(uint256 n) external {}

    // TODO: reset total to its default with delete
    function reset() external {}
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Tally {
    uint256 public total;

    function label(uint256 mark) external pure returns (string memory) {
        return mark >= 50 ? "pass" : "fail";
    }

    function add(uint256 n) external {
        total += n;
    }

    function reset() external {
        delete total;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "Tally", kind: "function", name: "label", inputs: ["uint256"], outputs: ["string"], stateMutability: "pure", message: "Has pure label(uint256) returning string" },
      { type: "abi", contract: "Tally", kind: "function", name: "add", inputs: ["uint256"], stateMutability: "nonpayable", message: "Has add(uint256)" },
      { type: "abi", contract: "Tally", kind: "function", name: "reset", inputs: [], stateMutability: "nonpayable", message: "Has reset()" },
      { type: "regex", pattern: "mark\\s*>=\\s*50\\s*\\?", message: "label uses a ternary on mark >= 50" },
      { type: "regex", pattern: "total\\s*\\+=\\s*n", message: "add uses total += n" },
      { type: "regex", pattern: "delete\\s+total\\s*;", message: "reset uses delete total" },
    ],
  },
};
