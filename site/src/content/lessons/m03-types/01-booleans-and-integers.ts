import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Under Solidity 0.8 defaults, what happens when `uint8 x = 250; x + 10;` is evaluated?", options: ["The result is 4", "The transaction reverts with a Panic error", "The result is 255", "The compiler refuses to build it"], answer: 1, explain: "Arithmetic is checked by default since 0.8, so a result that does not fit the type reverts. Wrapping to 4 is the pre-0.8 behaviour." },
  { q: "Which block makes `uint8(250) + 10` give 4 instead of reverting?", options: ["`wrap { ... }`", "`unchecked { ... }`", "`pure { ... }`", "`assembly { ... }` is the only way"], answer: 1, explain: "`unchecked` switches off the overflow check for the code written directly inside the block." },
  { q: "What do `7 / 2` and `-7 / 2` evaluate to on integers?", options: ["3 and -4", "4 and -4", "3 and -3", "3.5 and -3.5"], answer: 2, explain: "Integer division truncates toward zero; there is no fractional part." },
  { q: "Why are `fixed` and `ufixed` not a good way to store prices in a contract?", options: ["They are declared but cannot yet be used in arithmetic", "They are far too slow to use in a production contract", "They only exist on testnets and are blocked on mainnet", "They always round up to the next whole number when divided"], answer: 0, explain: "The language reserves the types but does not implement them. Contracts keep money as integers in the smallest unit." },
    { q: "Spot the bug: the author expects `uint8 x = 200; uint8 y = x << 1;` to revert because 400 does not fit in a uint8. What really happens?", options: ["It reverts with a Panic because the shift overflows", "It does not compile", "`y` is 255, the saturated maximum", "`y` is 144; shifts are not overflow-checked"], answer: 3, explain: "Shifts discard bits that fall off the end and do not revert, with or without `unchecked`. 400 mod 256 is 144." },
  { q: "What does `type(uint8).max` give?", options: ["256", "127", "255", "2**256 - 1"], answer: 2, explain: "A uint8 holds 8 bits, so the largest value is 2^8 - 1 = 255." },
  { q: "```solidity\nfunction f(uint x) public pure returns (uint) {\n    return 5 % x;\n}\n```\nWhat happens when `f(0)` is called?", options: ["Returns 0, because the remainder with zero is zero", "Reverts with a Panic (modulo or division by zero)", "Returns 5, because the zero divisor is ignored", "Returns the maximum uint256 value as a sentinel"], answer: 1, explain: "Modulo by zero panics with code 0x12, just like division by zero." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "clamp-score": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Scores {
    // TODO: pure clamp(uint8 x) returns (uint8): x if x <= 100, otherwise 100
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Scores {
    function clamp(uint8 x) public pure returns (uint8) {
        if (x > 100) {
            return 100;
        }
        return x;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "Scores", kind: "function", name: "clamp", inputs: ["uint8"], outputs: ["uint8"], stateMutability: "pure", message: "Has pure clamp(uint8) returning uint8" },
      { type: "regex", pattern: "(x\\s*>\\s*100|100\\s*<\\s*x|x\\s*>=\\s*101|x\\s*<=\\s*100|x\\s*<\\s*101)", message: "Compares x with the cap 100" },
      { type: "regex", pattern: "(return\\s+100\\s*;|\\?\\s*100\\s*:|:\\s*100\\s*;)", message: "Returns 100 when x is over the cap" },
      { type: "regex", pattern: "(return\\s+x\\s*;|[?:]\\s*x\\s*;)", message: "Returns x itself when it is within the cap" },
    ],
  },
};
