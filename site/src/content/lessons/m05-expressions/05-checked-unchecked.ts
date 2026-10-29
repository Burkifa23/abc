import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Under Solidity 0.8.x defaults, what does `uint8 a = 250; a += 10;` do?", options: ["Reverts with a panic", "Sets `a` to 4", "Sets `a` to 255 and stops", "Does not compile"], answer: 0, explain: "Since 0.8.0 arithmetic is checked. 260 does not fit in a `uint8`, so the call reverts with Panic(0x11). Wrapping to 4 is what the old behaviour, or `unchecked`, would do." },
  { q: "Inside `unchecked { ... }` you write `return helper(a, b);`, and `helper` is `a - b` with `a < b`. What happens?", options: ["It wraps around, because the block covers the whole call that happens inside it","It reverts: the block only covers statements written inside it","It does not compile, since unchecked blocks cannot contain function calls","It returns 0 after silently skipping the call entirely"], answer: 1, explain: "The unchecked setting applies only to code syntactically inside the braces. Functions called from there keep their own checks." },
  { q: "Spot the bug: the author wants to avoid a revert when `count` is 0, so writes `unchecked { return total / count; }`.", options: ["`unchecked` blocks cannot contain a `return` statement at all","`/` is not one of the operators that the block affects","`total` must be `int256` for the division to be allowed","It still panics (0x12) when `count` is 0"], answer: 3, explain: "Division and modulo by zero always panic. `unchecked` removes overflow checks only, so a real zero guard (`if (count == 0) revert ...`) is still needed." },
  { q: "Given `uint256 x = type(uint256).max;`, which of these reverts?", options: ["`x << 1`", "`uint8(x)`", "`x * 2`", "`x >> 1`"], answer: 2, explain: "Multiplication is checked. Shifts and explicit conversions never check: the shift drops high bits and `uint8(x)` keeps the low 8 bits." },
  { q: "Why is it reasonable to write `unchecked { ++i; }` at the end of `for (uint256 i = 0; i < list.length; )`?", options: ["`unchecked` makes any loop faster than the compiler's own optimisations can","`++i` can never overflow in any Solidity program, whatever the type","`i` is bounded by the array length, far below 2**256","The compiler never checks a variable that is used as a loop counter"], answer: 2, explain: "Safety comes from the bound, not from the keyword. If the bound could be near the maximum of the type, removing the check would be wrong." },
  { q: "`int8 x = -128; int8 y = -x;` runs under the default checking. What happens?", options: ["`y` is -128, since the value wraps silently","`y` is 128, widened to fit","It reverts, as 128 does not fit","The compiler rejects the code as an error"], answer: 2, explain: "Negative range has one more value than positive range, so negating the minimum overflows. In an `unchecked` block it would wrap back to -128." },
  { q: "Which explicit conversion can still cause a panic even though conversions normally never check?", options: ["`uint256` to `uint8`, whenever the value is too big","`int256` to `uint256`, whenever the value is negative","`bytes32` to `uint256`, whenever the top bytes are set","Out-of-range integer to an `enum`"], answer: 3, explain: "The enum conversion is the one exception: a value with no matching member panics with code 0x21. Integer-to-integer conversions simply truncate." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "unchecked-loop-counter": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Marks {
    // Add up all the marks.
    function sumMarks(uint256[] calldata marks) external pure returns (uint256 sum) {
        // TODO: loop with a counter i, leave the header's increment slot empty,
        // add marks[i] to sum (checked), then bump i inside an unchecked block
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Marks {
    // Add up all the marks.
    function sumMarks(uint256[] calldata marks) external pure returns (uint256 sum) {
        for (uint256 i = 0; i < marks.length; ) {
            sum += marks[i];
            unchecked {
                ++i;
            }
        }
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "Marks", kind: "function", name: "sumMarks", inputs: ["uint256[]"], outputs: ["uint256"], stateMutability: "pure", message: "sumMarks(uint256[]) returns uint256 and is pure" },
      { type: "regex", pattern: "for\\s*\\([^;]*;[^;]*;\\s*\\)", message: "The for header leaves the increment slot empty" },
      { type: "regex", pattern: "unchecked\\s*\\{\\s*\\+\\+\\s*i\\s*;\\s*\\}", message: "Increments the counter with ++i inside an unchecked block" },
      { type: "regex", pattern: "sum\\s*\\+=\\s*marks\\s*\\[\\s*i\\s*\\]", message: "Adds marks[i] to sum" },
    ],
  },
};
