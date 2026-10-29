import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Which statement does Solidity NOT have?", options: ["do ... while", "continue", "switch", "for"], answer: 2, explain: "Solidity has no switch (the word is reserved) and no goto. Use a chain of else if instead." },
  { q: "Spot the bug: `function open(uint256 seats) external pure returns (bool) { if (seats) { return true; } return false; }`", options: ["`pure` should be `view`", "`seats` is not a bool, so the condition does not compile", "`return` cannot appear inside `if`", "Nothing; it compiles and treats 0 as false"], answer: 1, explain: "Solidity never converts a number to bool. Write `if (seats != 0)` instead." },
  { q: "What does `digits(0)` return in the lesson's `do { count++; n /= 10; } while (n > 0);` version?", options: ["0", "It reverts", "Nothing, it loops forever", "1"], answer: 3, explain: "A do-while runs its body before testing the condition, so the body runs once and count becomes 1." },
  { q: "In `for (uint256 i = 0; i < 5; i++) { if (i == 2) continue; total += i; }` with total starting at 0, what is total at the end?", options: ["8", "10", "6", "3"], answer: 0, explain: "continue skips only the pass where i is 2, so we add 0 + 1 + 3 + 4 = 8." },
  { q: "Which of these is valid Solidity?", options: ["`if mark > 50 { pass++; }`", "`if (mark > 50) pass++;`", "`if (mark > 50): pass++`", "`if (mark > 50) then pass++;`"], answer: 1, explain: "Parentheses around the condition are required, but braces around a single-statement body are optional." },
  { q: "Spot the bug: `uint256 i = 0; while (i < n) { if (list[i] == 0) continue; total += list[i]; i++; }` can hang. Why?", options: ["`while` cannot contain `continue`", "`total` is not initialised", "When list[i] is 0, `continue` skips `i++`, so i never changes", "`list[i]` is out of range"], answer: 2, explain: "continue jumps straight to the next test, skipping the increment at the bottom. The same entry is tested forever until gas runs out." },
  { q: "A function with `returns (uint256 free)` has no explicit `return` statement and ends after its loop. What does the caller get?", options: ["The current value of `free`", "A compile error", "Zero, always", "An empty reply"], answer: 0, explain: "Named return variables are returned automatically when the function ends. They start at zero and keep whatever the code assigned." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "loop-tally": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MarkSheet {
    // Adds up the valid marks (0..100) in order.
    // - an entry above 100 is a typing error: skip it
    // - an entry equal to 0 ends the list: stop reading
    function tally(uint256[] calldata marks) external pure returns (uint256 total) {
        // TODO: loop over marks, using continue and break
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MarkSheet {
    // Adds up the valid marks (0..100) in order.
    // - an entry above 100 is a typing error: skip it
    // - an entry equal to 0 ends the list: stop reading
    function tally(uint256[] calldata marks) external pure returns (uint256 total) {
        for (uint256 i = 0; i < marks.length; i++) {
            if (marks[i] > 100) continue;
            if (marks[i] == 0) break;
            total += marks[i];
        }
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "MarkSheet", kind: "function", name: "tally", inputs: ["uint256[]"], outputs: ["uint256"], stateMutability: "pure", message: "tally(uint256[]) is pure and returns uint256" },
      { type: "regex", pattern: "\\b(for|while)\\s*\\(", message: "Uses a loop (for or while)" },
      { type: "regex", pattern: "\\bcontinue\\s*;", message: "Skips invalid entries with continue" },
      { type: "regex", pattern: "\\bbreak\\s*;", message: "Stops at the zero entry with break" },
      { type: "regex", pattern: "\\+=|total\\s*=\\s*total\\s*\\+", message: "Adds each valid mark to total" },
    ],
  },
};
