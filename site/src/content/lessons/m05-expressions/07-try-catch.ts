import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "What may follow the `try` keyword?", options: ["Any function call, including internal ones, as long as it is declared public","An external call or a `new` creation","Only calls to functions that return a value to the caller","Any expression at all that might revert when it is evaluated"], answer: 1, explain: "`try` accepts only an external call or `new Contract(...)`. To protect an internal function you would have to call it through `this.` as an external call." },
  { q: "A callee does `revert Unauthorized();` (a custom error). Which clause of `try grader.grade(id) ... catch Error(string memory r) {...} catch (bytes memory d) {...}` runs?", options: ["`catch Error`, with `r` left as an empty string","None; the statement reverts because the error is a custom one","Neither clause; custom errors always bubble up past a try","The `catch (bytes memory d)` clause"], answer: 3, explain: "A custom error does not match `Error(string)` or `Panic(uint256)`, so it lands in the bytes clause. You can compare the first four bytes with the error's selector." },
  { q: "Spot the bug: `try other.fetch(id) returns (uint256 v) { total += v / divisor; } catch { }` and `divisor` is 0.", options: ["Division by zero inside the success block is caught by the empty `catch` clause","`returns` cannot be combined with a bare `catch` in the same statement","It is not caught: the whole function reverts","`total` must be declared inside the success block to be modified"], answer: 2, explain: "Only failures in the external call are caught. Code in the success block is ordinary code of the caller, so its panic makes the caller revert." },
  { q: "The target address of a `try` call holds no code. What happens?", options: ["The `catch` block runs and handles the missing code","The call returns zeros and the success block runs with them","The error is silently ignored and execution moves on","The caller reverts, uncaught"], answer: 3, explain: "The compiler checks that the address has code before making the call, and a failure there happens in the caller, outside the protected call." },
  { q: "In which situation do the effects of the called function remain in place?", options: ["When the success block runs", "When `catch Error` runs", "When `catch Panic` runs", "When the bytes clause runs"], answer: 0, explain: "Reaching any catch block means the callee's changes were reverted. Reaching the success block means they were kept." },
  { q: "Why should a catch block not assume it has lots of gas left?", options: ["Catch blocks always run at a fixed gas price set by the EVM","The caller keeps only a small share (1/64) of the gas","Catch blocks cannot write to storage in any circumstances","The EVM limits every catch block to a hard cap of 100 gas"], answer: 1, explain: "A call forwards at most 63/64 of the remaining gas. If the callee runs out of gas, the caller continues with what it kept, which may be little." },
  { q: "To make sure a `try` statement catches every kind of failure of the call, you should include...", options: ["only `catch Error(string memory)` is enough for everything","`catch Error(string memory)` plus `catch Panic(uint256)` together","`catch { ... }` or `catch (bytes memory data)`","a `finally` block placed after the last catch clause"], answer: 2, explain: "Only the unnamed or bytes clause matches all error data, including empty reverts and custom errors. Solidity has no `finally`." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "safe-grade-try-catch": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IGrader {
    function grade(uint256 studentId) external returns (uint256);
}

contract Portal {
    uint256 public failures;

    function safeGrade(IGrader g, uint256 studentId) external returns (uint256 score, bool ok) {
        // TODO: try g.grade(studentId) returns (uint256 s) and return (s, true)
        // TODO: catch Error(string memory), catch Panic(uint256) and catch (bytes memory):
        //       in each one add 1 to failures and return (0, false)
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IGrader {
    function grade(uint256 studentId) external returns (uint256);
}

contract Portal {
    uint256 public failures;

    function safeGrade(IGrader g, uint256 studentId) external returns (uint256 score, bool ok) {
        try g.grade(studentId) returns (uint256 s) {
            return (s, true);
        } catch Error(string memory) {
            failures++;
            return (0, false);
        } catch Panic(uint256) {
            failures++;
            return (0, false);
        } catch (bytes memory) {
            failures++;
            return (0, false);
        }
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "Portal", kind: "function", name: "safeGrade", inputs: ["address", "uint256"], outputs: ["uint256", "bool"], message: "safeGrade(address,uint256) returns (uint256,bool)" },
      { type: "regex", pattern: "try\\s+g\\s*\\.\\s*grade\\s*\\(\\s*studentId\\s*\\)\\s*returns\\s*\\(\\s*uint256\\s+\\w+\\s*\\)", message: "Uses try g.grade(studentId) returns (uint256 ...)" },
      { type: "regex", pattern: "catch\\s+Error\\s*\\(\\s*string\\s+memory", message: "Has a catch Error(string memory ...) clause" },
      { type: "regex", pattern: "catch\\s+Panic\\s*\\(\\s*uint(256)?", message: "Has a catch Panic(uint256 ...) clause" },
      { type: "regex", pattern: "failures\\s*(\\+\\+|\\+=)[\\s\\S]*failures\\s*(\\+\\+|\\+=)[\\s\\S]*failures\\s*(\\+\\+|\\+=)", message: "Each catch body adds to failures" },
      { type: "regex", pattern: "catch\\s*\\(\\s*bytes\\s+memory", message: "Has a catch (bytes memory ...) clause" },
    ],
  },
};
