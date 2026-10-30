import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Which two visibilities can a function type have?", options: ["public and private", "view and pure", "internal and external", "internal and public"], answer: 2, explain: "Function types are either internal (a jump inside this code) or external (address plus selector). Internal is the default." },
  { q: "Inside a contract with `function vote(uint256) public {}`, what does `this.vote.selector` give?", options: ["The address of the contract that holds `vote`", "The gas cost of calling `vote` with these arguments", "The function's compiled code, copied into the call", "The first 4 bytes of the hash of `vote(uint256)`"], answer: 3, explain: "`.selector` is the four-byte function identifier used in calldata. `.address` would give the contract address." },
  { q: "A `pure` function is passed where `function (uint256) view returns (uint256)` is expected. What happens?", options: ["It compiles; pure is stricter than view", "It fails; mutability must match exactly", "It compiles but reverts", "It fails; pure functions cannot be passed"], answer: 0, explain: "A function may be used where a looser mutability is expected, because pure promises more than view does." },
  { q: "Spot the bug: a `view` function is passed where `function (uint256) pure returns (uint256)` is expected.", options: ["Nothing happens; it only reads state, so it is allowed", "It is rejected: view promises less than pure requires", "It works, but costs more gas because it reads state", "It reverts at runtime when the pointer is called"], answer: 1, explain: "The conversion would go from looser to stricter, which could let state reads sneak into code that promised purity." },
  { q: "Why can an internal function value not be a parameter of an `external` function?", options: ["Internal values only exist within this contract's own code", "It is just a style rule the compiler happens to enforce", "Because the ABI has no number types that could hold such a pointer", "Because it is too expensive in gas to encode a function"], answer: 0, explain: "An internal value is a code location. Another contract cannot use it. An external value is address plus selector, which can travel." },
  { q: "What does the bare name `f` give you compared to `this.f` inside a contract?", options: ["Both are internal values with the same type", "`f` is an external value; `this.f` is an internal value", "`f` is internal; `this.f` is an external value", "`this.f` is a compile error inside the contract"], answer: 2, explain: "The bare name jumps inside the code. `this.f` goes through the contract's address, so it is external." },
  { q: "```solidity\nfunction (uint256) internal pure returns (uint256) rule;\nfunction run() public view returns (uint256) { return rule(3); }\n```\nWhat happens when `run()` is called and `rule` was never set?", options: ["Returns 0, because an empty pointer defaults to zero", "Returns 3, the value the function would return", "Reverts with a Panic: the pointer is empty", "It does not compile because a pointer needs an initialiser"], answer: 2, explain: "A zero-initialised internal function value fails with a panic when called. Check before calling." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "apply-twice": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Curve {
    function double(uint256 x) private pure returns (uint256) {
        return x * 2;
    }

    // TODO: internal pure applyTwice(function (uint256) pure returns (uint256) f, uint256 x)
    //       returns (uint256): calls f twice
    // TODO: make quadruple use applyTwice with double

    function quadruple(uint256 x) public pure returns (uint256) {
        return 0;
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Curve {
    function double(uint256 x) private pure returns (uint256) {
        return x * 2;
    }

    function applyTwice(function (uint256) pure returns (uint256) f, uint256 x)
        internal pure returns (uint256)
    {
        return f(f(x));
    }

    function quadruple(uint256 x) public pure returns (uint256) {
        return applyTwice(double, x);
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "Curve", kind: "function", name: "quadruple", inputs: ["uint256"], outputs: ["uint256"], stateMutability: "pure", message: "Has pure quadruple(uint256) returning uint256" },
      { type: "regex", pattern: "function\\s*\\(\\s*uint256\\s*\\)\\s*(internal\\s+)?pure\\s+returns\\s*\\(\\s*uint256\\s*\\)\\s+\\w+", message: "A parameter has a function type" },
      { type: "regex", pattern: "return\\s+(\\w+)\\s*\\(\\s*\\1\\s*\\(\\s*\\w+\\s*\\)\\s*\\)\\s*;", message: "applyTwice returns f(f(x))" },
      { type: "regex", pattern: "return\\s+applyTwice\\s*\\(\\s*double\\s*,\\s*\\w+\\s*\\)\\s*;", message: "quadruple returns applyTwice(double, x)" },
    ],
  },
};
