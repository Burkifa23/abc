import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Since 0.5.0, what does `function f(int256 x) external pure returns (int256) { return x >> 1; }` return for `x = -3`?", options: ["-1, because the shift rounds toward zero just like integer division in earlier versions", "-2, because the shift rounds toward negative infinity", "-3, since shifting never changes negative numbers", "It reverts, as signed shifts are not allowed"], answer: 1, explain: "Signed right shift became a true arithmetic shift in 0.5.0: -3 / 2 rounds down to -2. Before that it behaved like division and gave -1, which is the kind of silent change that makes old-code audits tricky." },
  { q: "Spot the bug: a port of a 0.6 hash-chain counter contains `function next(uint8 x) external pure returns (uint8) { return x + 1; }` and relies on `next(255)` returning 0. What happens on 0.8?", options: ["It returns 0, as before, because `uint8` always wraps around at 255", "It returns 256, since the result of the addition is silently widened to a larger integer type", "It silently returns 255, because the addition is simply skipped whenever it would overflow", "It reverts with a Panic, because arithmetic is now checked; use `unchecked` to wrap"], answer: 3, explain: "Checked arithmetic is the headline change of 0.8.0. The compiler does not complain about the port; it just behaves differently. If wrapping is really the intent, say so explicitly with `unchecked`." },
  { q: "Which of these compiles on 0.8? A: `target.call{value: 1, gas: 5000}(\"\")` B: `target.call{value: 1}{gas: 5000}(\"\")` C: `target.call.value(1)(\"\")` D: `target.call{value: 1}.gas(5000)(\"\")`", options: ["A only", "A and B", "A and C", "A, C and D"], answer: 0, explain: "0.7.0 moved call options into braces, and 0.8.0 requires them to be combined in one set. B repeats the braces and C and D use the removed `.value()`/`.gas()` forms." },
  { q: "With `int8 x = -1`, which expression gives 255 as a `uint16` on 0.8?", options: ["`uint16(x)`, since the sign is simply dropped when widening to an unsigned type", "`uint16(int16(x))`, which widens first and then reinterprets the sign", "`uint16(uint8(x))`, which reinterprets the byte first and widens second", "`uint16(x & 0xff)`, which masks the low byte directly"], answer: 2, explain: "Since 0.8.0 a conversion may change only one of sign, width or category. `uint16(x)` is rejected. Going through `int16` keeps the sign and gives 65535; going through `uint8` reinterprets the single byte as 255 and then widens it." },
  { q: "A contract defines both `receive() external payable` and `fallback() external`. A caller sends 1 wei with empty calldata. Which function runs?", options: ["`receive`, because the calldata is empty and no function selector is present", "`fallback`, because it handles anything that is not a named function", "Neither; the call reverts, since `fallback` is not payable and nothing else can accept Ether", "Both, in the order they are written in the contract"], answer: 0, explain: "Since 0.6.0 the receive function runs whenever calldata is empty. `fallback` handles calls that match no function (and, without a `receive`, empty calls too)." },
  { q: "Why is it risky to declare a pre-0.5 contract's `constant` function as `view` in your new interface?", options: ["A `view` interface cannot be implemented by any contract that was compiled with an older compiler", "Calls use `STATICCALL`, and an unenforced `constant` function may write state and so revert", "The compiler refuses to generate a `STATICCALL` for interfaces", "`constant` and `view` use different selectors in the ABI"], answer: 1, explain: "Before 0.5 the `constant` keyword was not checked. A function declared that way might still write storage, and a `view` call is made with `STATICCALL`, which reverts on a state write. Declare it non-view unless you know it is read-only." },
  { q: "Spot the bug: `uint256[] items; function drop() external { items.length--; }` was valid in 0.5. What does 0.6 and later require?", options: ["`items.length -= 1;`, which is still allowed", "`delete items[items.length - 1];`, which also shrinks the array", "`items.pop();`, because the array length became read-only", "`items = new uint256[](items.length - 1);`, the only remaining way"], answer: 2, explain: "From 0.6.0 `length` is read-only for all arrays, to prevent storage collisions with gigantic arrays. Grow with `push()` or `push(value)`, shrink with `pop()`." },
  { q: "Which language is credited for Solidity's modifiers, multiple inheritance with C3 linearization and the `super` keyword?", options: ["C++", "JavaScript", "Python", "Java"], answer: 2, explain: "C++ shaped most of the syntax and JavaScript the early scoping rules, but modifiers (modelled on decorators), C3 linearization and `super` come from Python." },
];

const head = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Piggy {
`;

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "port-piggy": {
    starter: `${head}    address owner;
    uint unlockAt;
    mapping(address => uint) saved;

    // TODO: everything below is 0.4-style. Port it so it compiles with no warnings.
    function Piggy(uint lockSeconds) {
        owner = msg.sender;
        unlockAt = now + lockSeconds;
    }

    function() payable {
        saved[msg.sender] += msg.value;
    }

    function withdraw() public {
        require(now >= unlockAt);
        uint amount = saved[msg.sender];
        saved[msg.sender] = 0;
        if (!msg.sender.call.value(amount)()) {
            throw;
        }
    }
}
`,
    solution: `${head}    address public owner;
    uint256 public unlockAt;
    mapping(address => uint256) public saved;

    constructor(uint256 lockSeconds) {
        owner = msg.sender;
        unlockAt = block.timestamp + lockSeconds;
    }

    receive() external payable {
        saved[msg.sender] += msg.value;
    }

    function withdraw() external {
        require(block.timestamp >= unlockAt);
        uint256 amount = saved[msg.sender];
        saved[msg.sender] = 0;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok);
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "noWarnings" },
      { type: "abi", contract: "Piggy", kind: "function", name: "withdraw", inputs: [], stateMutability: "nonpayable", message: "Still has a nonpayable withdraw()" },
      { type: "regex", pattern: "\\bconstructor\\s*\\(\\s*uint(?:256)?\\s+\\w+\\s*\\)", message: "Uses the constructor keyword with the lock-time argument" },
      { type: "regex", pattern: "\\breceive\\s*\\(\\s*\\)\\s*external\\s+payable", message: "Accepts deposits through receive() external payable" },
      { type: "regex", pattern: "block\\.timestamp", message: "Reads time from block.timestamp" },
      { type: "regex", pattern: "\\.call\\s*\\{\\s*value\\s*:", message: "Sends the Ether with call{value: ...}" },
    ],
  },
};
