import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "What does the `_;` statement mean inside a modifier?", options: ["It marks the end of the modifier and everything after is ignored", "It declares a variable with no name", "It marks where the modified function's body is inserted", "It repeats the previous statement once more"], answer: 2, explain: "The underscore is the placeholder: the function body is placed there. Code before it runs first, code after it runs when the body has finished." },
  { q: "Given `function run() external first second { ... }`, in which order do the modifiers' code before `_;` run?", options: ["`second`, then `first`", "In the order the compiler finds most efficient", "Both together, in parallel", "`first`, then `second`, then the body"], answer: 3, explain: "Modifiers apply in the order written. The first is the outer wrapper, so its pre-body code runs first and its post-body code runs last." },
  { q: "A modifier `minimumAge(uint8 age, uint8 required)` runs `_;` only if `age >= required`. A caller is too young and the function returns `uint256`. What do they get?", options: ["The call reverts with a panic", "The default value, 0, because the body was skipped", "The previous return value from the last successful call", "A compile error at the call site"], answer: 1, explain: "If a modifier never reaches `_;`, the body does not run and the return variables keep their default values. No revert happens unless you write one." },
  { q: "Spot the bug: `modifier onlyOwner() { require(msg.sender == owner); }`. What happens when the compiler sees it?", options: ["It accepts it and the function body simply always runs", "It rejects it: a modifier body has to contain the placeholder `_;`", "It accepts it but the check is skipped for the contract's own address", "It accepts it, and the function body never runs for anyone"], answer: 1, explain: "A modifier without `_;` is a compile-time error, because there would be no place to insert the function body. Add `_;` after the check." },
  { q: "Which statement about a modifier and the function's parameters is correct?", options: ["A modifier can only receive them if they are passed in explicitly, like `minimumAge(age, 18)`", "A modifier can read the function's parameters by name automatically", "A modifier can change the function's return variables by name", "A modifier never sees parameters, even if passed explicitly"], answer: 0, explain: "Modifiers cannot implicitly access or change a function's arguments or return values. Values are handed over in the argument list where the modifier is applied." },
  { q: "A function with the modifier `oneAtATime` (which sets `busy = true; _; busy = false;`) runs `return 5;` in its body. Does `busy = false;` still run?", options: ["No, `return` exits everything immediately, modifiers included", "Only if the function is declared `view`", "Yes, return only leaves the body; control continues after `_;`", "Only on the first call"], answer: 2, explain: "An explicit return leaves just the current body. The modifier continues after the placeholder and the return value is kept." },
  { q: "What is needed so a derived contract can override a modifier from its base?", options: ["Nothing, modifiers are always replaceable", "The base modifier must be `public`", "The derived contract must be declared `abstract`", "The base modifier must be marked `virtual`"], answer: 3, explain: "Only modifiers marked `virtual` can be overridden. Lesson 11 shows the full override rules." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "only-owner": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Notice {
    address public owner;
    string public latest;

    error NotOwner();

    constructor() {
        owner = msg.sender;
    }

    // TODO: write a modifier onlyOwner that reverts with NotOwner() unless
    // msg.sender is the owner, then lets the function body run

    // TODO: apply it so that only the owner can post
    function post(string calldata text) external {
        latest = text;
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Notice {
    address public owner;
    string public latest;

    error NotOwner();

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function post(string calldata text) external onlyOwner {
        latest = text;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "regex", pattern: "modifier\\s+onlyOwner\\b", message: "Defines a modifier named onlyOwner" },
      { type: "regex", pattern: "msg\\.sender\\s*(==|!=)\\s*owner|owner\\s*(==|!=)\\s*msg\\.sender", message: "The modifier compares msg.sender with owner" },
      { type: "regex", pattern: "\\b_\\s*;", message: "The modifier contains the placeholder _;" },
      { type: "regex", pattern: "function\\s+post\\s*\\([^)]*\\)[^{]*\\bonlyOwner\\b", message: "post uses onlyOwner" },
      { type: "abi", contract: "Notice", kind: "function", name: "post", inputs: ["string"], stateMutability: "nonpayable", message: "post(string) is still in the ABI" },
    ],
  },
};
