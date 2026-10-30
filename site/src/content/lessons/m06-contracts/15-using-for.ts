import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "```solidity\nusing Tally for uint256[];\n```\nWhat does `marks.sum()` mean if `marks` is a `uint256[] storage`?", options: ["`Tally.sum(marks)`, with marks passed in", "`Tally.sum()` with no arguments, then marks is added to the result", "A call to a function named sum stored inside the array", "A compile error: arrays cannot have member functions of any kind"], answer: 0, explain: "A function attached with `using` receives the object it is called on as its first parameter." },
  { q: "What does the word `global` do in `using {add as +} for Price global;`?", options: ["It lets the function modify any state variable in any contract it likes", "It makes `add` available on every type, including `uint256`", "It attaches them wherever the type is visible, in all files", "It publishes the function so that users can call it from outside the chain"], answer: 2, explain: "Without `global`, the attachment only applies in the current file. With it, the functions and operators travel with the type." },
  { q: "```solidity\nusing {add as +} for uint256 global;\n```\nWhat happens?", options: ["It compiles, and + now calls add for every uint256 in the whole project", "It compiles, but the attachment only works inside the file that contains it", "It fails: `global` needs a type declared in this file", "It compiles only if add is a library function"], answer: 2, explain: "`global` is only allowed for user-defined types that were declared in the same file. Built-in types such as uint256 cannot be extended globally." },
  { q: "Which of these can be attached to a user-defined value type as the `*` operator?", options: ["A public function in a library contract", "A pure free function taking two values and returning one", "A view function that reads the storage of a contract", "An external function of some other contract"], answer: 1, explain: "Operator functions must be free functions that are pure, with parameters and return type matching the operator's signature." },
  { q: "Spot the bug: `type Mark is uint256; using {gt as >} for Mark global; function gt(Mark a, Mark b) pure returns (Mark) { return a; }`", options: ["Nothing is wrong: all operators return the same type", "`gt` must be a library function", "`global` cannot be used with comparison operators", "A comparison operator must return `bool`, not `Mark`"], answer: 3, explain: "Comparison operators such as `>` need a function with the signature `(T, T) pure returns (bool)`." },
  { q: "A contract has `using Tally for uint256[];`. A second contract inherits from it. Can the child call `marks.sum()`?", options: ["Yes: using directives are inherited automatically by every child", "Yes, but only when the child is in the same file as the parent", "No: the child has to repeat the directive itself", "No: a library can only be attached to one single contract in a project"], answer: 2, explain: "A `using` directive is limited to its own contract or file. Derived contracts and other files must write their own." },
  { q: "```solidity\nusing {inc} for uint256;\nfunction inc(uint256 x) pure returns (uint256) { return x + 1; }\n```\nWhat can you write for a variable `uint256 n`?", options: ["`n.inc()`", "`inc.n()`", "`n + inc`", "`n.inc` without parentheses"], answer: 0, explain: "The function is attached as a member, so `n.inc()` calls `inc(n)`. The variable goes before the dot." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "price-plus": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

type Price is uint256;

// Hint: the syntax is  using {fn as +} for Type global;
// TODO: attach add as the + operator for Price, globally.

function add(Price a, Price b) pure returns (Price) {
    return Price.wrap(Price.unwrap(a) + Price.unwrap(b));
}

contract Menu {
    // TODO: use + instead of calling add(...)
    function total(Price a, Price b) external pure returns (Price) {
        return add(a, b);
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

type Price is uint256;

using {add as +} for Price global;

function add(Price a, Price b) pure returns (Price) {
    return Price.wrap(Price.unwrap(a) + Price.unwrap(b));
}

contract Menu {
    function total(Price a, Price b) external pure returns (Price) {
        return a + b;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "regex", pattern: "using\\s*\\{\\s*add\\s+as\\s*\\+\\s*\\}\\s*for\\s+Price\\s+global\\s*;", message: "using {add as +} for Price global;" },
      { type: "regex", pattern: "return\\s+a\\s*\\+\\s*b\\s*;", message: "total uses the + operator" },
      { type: "abi", contract: "Menu", kind: "function", name: "total", inputs: ["uint256", "uint256"], outputs: ["uint256"], stateMutability: "pure", message: "Menu has pure total(Price, Price) returns (Price)" },
    ],
  },
};
