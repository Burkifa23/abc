import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "What does `1 gwei == 1e9` tell you?", options: ["A gwei is a billion times smaller than a wei", "A gwei is worth one billion wei", "A gwei is worth one billion ether", "The comparison does not compile"], answer: 1, explain: "Wei is the smallest unit, so a gwei is 1,000,000,000 wei. An ether is 1e18 wei." },
  { q: "What is the value of `2 hours + 30 minutes` in the EVM?", options: ["32", "150", "8,400", "9,000"], answer: 3, explain: "2 hours is 7,200 seconds and 30 minutes is 1,800 seconds, so the total is 9,000 seconds. Time units always reduce to seconds." },
  { q: "Spot the bug: `uint256 lock = block.timestamp + waitDays days;` where `waitDays` is a parameter.", options: ["`block.timestamp` is not allowed in a comparison like this one", "`days` should be written in the singular as `day`", "The statement needs the `payable` keyword", "A unit suffix must follow a literal: `waitDays * 1 days`"], answer: 3, explain: "Suffixes attach to number literals only. Multiplying a variable by the literal `1 days` gives the same result and compiles." },
  { q: "Why did Solidity 0.5.0 remove the `years` suffix?", options: ["Contracts on Ethereum can never run for as long as a year", "It was replaced by `months`, which is exact on every chain", "Years are not a fixed number of seconds because of leap years", "It clashed with the name `year` in the Solidity standard library"], answer: 2, explain: "A year may have 365 or 366 days, so a fixed suffix would silently be wrong. The same reasoning is why even `1 days` is only an approximation of a calendar day." },
  { q: "Given `uint256 public constant TIP = 0.5 wei;`, what happens?", options: ["A compile error: the result is not a whole number of wei", "It compiles and stores 0, because the fraction is rounded down", "It compiles and stores 1, rounding the fraction up", "It compiles but reverts at runtime on the first call"], answer: 0, explain: "The literal is converted to an integer at compile time. Half a wei is not an integer, so the compiler refuses it." },
  { q: "Which statement about `uint256 public constant FEE = 2 ether;` is correct?", options: ["FEE holds 2", "FEE holds 2e18 and forgets it was written in ether", "FEE is stored as a special currency type with units", "FEE can only be compared with other values in ether units"], answer: 1, explain: "The suffix is a compile-time multiplier. At runtime FEE is just a uint256 equal to 2 * 10^18 wei." },
  { q: "Which of these time suffixes exists in Solidity 0.8?", options: ["`years`", "`months`", "`weeks`", "`fortnights`"], answer: 2, explain: "The available suffixes are seconds, minutes, hours, days and weeks. Years were removed and months never existed." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "unit-constants": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Fees {
    // TODO: FEE is one hundredth of an ether (use a unit suffix)
    uint256 public constant FEE = 0;
    // TODO: WINDOW is seven days (use a unit suffix)
    uint256 public constant WINDOW = 0;
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Fees {
    uint256 public constant FEE = 0.01 ether;
    uint256 public constant WINDOW = 7 days;
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "Fees", kind: "function", name: "FEE", inputs: [], outputs: ["uint256"], stateMutability: "view", message: "FEE is a public uint256" },
      { type: "abi", contract: "Fees", kind: "function", name: "WINDOW", inputs: [], outputs: ["uint256"], stateMutability: "view", message: "WINDOW is a public uint256" },
      { type: "regex", pattern: "\\bFEE\\s*=\\s*0?\\.01\\s+ether\\s*;", message: "FEE is written as 0.01 ether" },
      { type: "regex", pattern: "\\bWINDOW\\s*=\\s*7\\s+days\\s*;", message: "WINDOW is written as 7 days" },
    ],
  },
};
