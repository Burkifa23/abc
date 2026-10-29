import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "`nextNumber()` increments a counter and returns it. What does `nextNumber() * 10 + nextNumber()` give, starting from 0?", options: ["Always 12", "Always 21", "12 or 21; the order of the two calls is not specified", "It reverts"], answer: 2, explain: "Solidity does not fix the order in which sub-expressions are evaluated. Put each call on its own statement if the order matters." },
  { q: "Spot the bug: `return a / b > 2 && b != 0;` is meant to avoid dividing by zero.", options: ["`&&` does not short-circuit", "The division is evaluated first, so b == 0 panics before the guard is checked", "`2` must be `uint256(2)`", "Nothing is wrong"], answer: 1, explain: "Short-circuit evaluation goes left to right. Put the guard first: `b != 0 && a / b > 2`." },
  { q: "Given `function f() public pure returns (uint256, bool, uint256)`, which line is valid?", options: ["`(uint256 a, , uint256 c) = f();`", "`(uint256 a, uint256 c) = f();`", "`uint256 a = f();`", "`(a, uint256 c, bool d) = f();` where `a` already exists"], answer: 0, explain: "The number of components must match, and an empty slot ignores one. Mixing a declaration with an existing variable in one tuple is not allowed." },
  { q: "After `(x, y) = (y, x);` with `uint256 x = 1; uint256 y = 2;`, what are x and y?", options: ["x = 1, y = 2", "x = 2, y = 1", "x = 2, y = 2", "It does not compile"], answer: 1, explain: "The right side is built first as a tuple, and then assigned to the left side, so the values are swapped." },
  { q: "`uint256[3] marks;` is a state variable. `function bump(uint256[3] memory m) internal pure { m[0] = 9; }` is called as `bump(marks);`. What is `marks[0]` afterwards?", options: ["9", "0, because the function got a copy", "It reverts", "It depends on the gas"], answer: 1, explain: "A memory parameter receives an independent copy of the storage array. Only a `storage` parameter would let the function change the original." },
  { q: "What is the default value of a declared `enum Stage { Open, Closed } Stage s;`?", options: ["`Stage.Closed`", "`Stage.Open`, its first member", "It has no value until assigned and reading it reverts", "`null`"], answer: 1, explain: "Every variable starts as all-zero bytes. For an enum that is the first member." },
  { q: "Spot the bug: `function f() external pure returns (uint256) { total = 5; uint256 total; return total; }`", options: ["`total` is used before its declaration, which is a compile error", "`pure` functions cannot assign", "`uint256` must be `uint`", "The return type is wrong"], answer: 0, explain: "A local variable is visible only from the line after its declaration. Since Solidity 0.5.0 there is no hoisting of locals to the top of the function." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "span-destructure": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Spread {
    // Return the smaller input first, then the larger one.
    function order(uint256 a, uint256 b) public pure returns (uint256 low, uint256 high) {
        // TODO: put a and b into low and high, swapping with a tuple assignment if needed
    }

    // Return high - low, using the two values that order() gives back.
    function gap(uint256 a, uint256 b) external pure returns (uint256) {
        // TODO: destructure both return values of order() into new variables
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Spread {
    // Return the smaller input first, then the larger one.
    function order(uint256 a, uint256 b) public pure returns (uint256 low, uint256 high) {
        (low, high) = (a, b);
        if (low > high) {
            (low, high) = (high, low);
        }
    }

    // Return high - low, using the two values that order() gives back.
    function gap(uint256 a, uint256 b) external pure returns (uint256) {
        (uint256 lo, uint256 hi) = order(a, b);
        return hi - lo;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "Spread", kind: "function", name: "order", inputs: ["uint256", "uint256"], outputs: ["uint256", "uint256"], stateMutability: "pure", message: "order returns two uint256 values" },
      { type: "abi", contract: "Spread", kind: "function", name: "gap", inputs: ["uint256", "uint256"], outputs: ["uint256"], stateMutability: "pure", message: "gap returns one uint256" },
      { type: "regex", pattern: "\\(\\s*(\\w+)\\s*,\\s*(\\w+)\\s*\\)\\s*=\\s*\\(\\s*\\2\\s*,\\s*\\1\\s*\\)", message: "order swaps with a tuple assignment such as (low, high) = (high, low)" },
      { type: "regex", pattern: "\\(\\s*uint256\\s+\\w+\\s*,\\s*uint256\\s+\\w+\\s*\\)\\s*=\\s*order\\s*\\(", message: "gap destructures order(...) into two new uint256 variables" },
    ],
  },
};
