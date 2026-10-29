import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Which two visibilities can a function type have?", options: ["public and private", "internal and external", "view and pure", "internal and public"], answer: 1, explain: "Function types are either internal (a jump inside this code) or external (address plus selector). Internal is the default." },
  { q: "Inside a contract with `function vote(uint256) public {}`, what does `this.vote.selector` give?", options: ["The address of the contract", "The first four bytes of the hash of `vote(uint256)`", "The gas cost of `vote`", "The function's code"], answer: 1, explain: "`.selector` is the four-byte function identifier used in calldata. `.address` would give the contract address." },
  { q: "A `pure` function is passed where `function (uint256) view returns (uint256)` is expected. What happens?", options: ["It compiles; pure is stricter than view", "It fails; mutability must match exactly", "It compiles but reverts", "It fails; pure functions cannot be passed"], answer: 0, explain: "A function may be used where a looser mutability is expected, because pure promises more than view does." },
  { q: "Spot the bug: a `view` function is passed where `function (uint256) pure returns (uint256)` is expected.", options: ["Nothing; it reads only", "It is rejected because view promises less than pure requires", "It works but costs more gas", "It reverts at runtime"], answer: 1, explain: "The conversion would go from looser to stricter, which could let state reads sneak into code that promised purity." },
  { q: "Why can an internal function value not be a parameter of an `external` function?", options: ["Internal values are only valid inside this contract's own code; they cannot be sent as data", "It is just a style rule", "Because the ABI has no number types", "Because it is too expensive"], answer: 0, explain: "An internal value is a code location. Another contract cannot use it. An external value is address plus selector, which can travel." },
  { q: "What does the bare name `f` give you compared to `this.f` inside a contract?", options: ["Both are internal values", "`f` is an internal value; `this.f` is an external value", "`f` is external; `this.f` is internal", "`this.f` is an error"], answer: 1, explain: "The bare name jumps inside the code. `this.f` goes through the contract's address, so it is external." },
  { q: "```solidity\nfunction (uint256) internal pure returns (uint256) rule;\nfunction run() public view returns (uint256) { return rule(3); }\n```\nWhat happens when `run()` is called and `rule` was never set?", options: ["Returns 0", "Returns 3", "Reverts with a Panic, because the pointer is empty", "It does not compile"], answer: 2, explain: "A zero-initialised internal function value fails with a panic when called. Check before calling." },
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
