import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Which of these makes a function ineligible to be `view`?", options: ["Reading a state variable", "Calling another `view` function", "Emitting an event, since that writes to the log", "Reading `msg.sender`"], answer: 2, explain: "Emitting an event writes a log, which counts as modifying state. Reading state, calling view functions and reading msg.sender are all allowed in view." },
  { q: "Which statement is allowed inside a `pure` function?", options: ["`return msg.sig;`, which comes from the call itself", "`return block.timestamp;`", "`return address(this).balance;`", "`return counter;` where `counter` is a state variable"], answer: 0, explain: "msg.sig and msg.data come from the call data itself, so they are the only msg members allowed in pure. block, balance and state variables all read the chain." },
  { q: "What does the EVM do to enforce `view`?", options: ["Nothing at all: it is only a compile-time check done by the compiler", "It refuses to deploy any contract that contains a view function at all", "It runs the call with `STATICCALL`, so any state write inside fails", "It copies the contract's whole storage first, then discards that copy afterwards"], answer: 2, explain: "Since Byzantium, calls to view and pure functions use STATICCALL, a mode in which state-changing opcodes fail. (Library functions use DELEGATECALL, so only the compiler checks them.)" },
  { q: "Spot the bug: `function total(uint256 a, uint256 b) external pure returns (uint256 sum, uint256 diff) { sum = a + b; return; }` with `diff` also meant to be set. Which is the accurate description?", options: ["It does not compile, because the named variable `diff` is never assigned a value", "It compiles, and `diff` is returned as 0, its default value", "It compiles, but quietly returns the `diff` value left over from the previous call", "It reverts at run time with a panic"], answer: 1, explain: "Named return variables start at their default value and keep it unless assigned. The compiler does not force you to assign them, so the bug is silent." },
  { q: "Given `function f() external pure returns (uint256, uint256) { return (7, 8); }`, which line destructures it and keeps only the second value?", options: ["`uint256 b = f()[1];`", "`(, uint256 b) = f();`", "`uint256 b = f().second;`", "`(uint256 b) = f(1);`"], answer: 1, explain: "Tuples are destructured with parentheses, and an empty slot (a bare comma) skips a value. They cannot be indexed." },
  { q: "A function has no mutability keyword and no `payable`. What happens if someone calls it and attaches ether?", options: ["The call reverts", "The ether is kept by the contract as a donation", "The ether is returned to the sender after the call", "The call succeeds, because ether is always accepted"], answer: 0, explain: "Without `payable`, a function rejects calls that carry ether." },
  { q: "Why can the EVM enforce `view` but not `pure`?", options: ["`pure` functions are normally too short for the EVM to bother checking them", "Reads are not blocked by any opcode, so only the compiler can check `pure`", "Both are enforced identically, by one and the same dedicated opcode", "`pure` was quietly removed from the EVM itself in the Byzantium upgrade"], answer: 1, explain: "STATICCALL forbids writes but there is no mode that forbids reads, so the no-read promise of pure is checked at compile time only." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "mutability-trio": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Gradebook {
    uint256 public passMark = 50;

    // TODO: reads passMark but changes nothing
    function isPass(uint256 score) external returns (bool) {
        return score >= passMark;
    }

    // TODO: uses only its argument, never the chain
    function curve(uint256 score) external view returns (uint256) {
        return score + 5 > 100 ? 100 : score + 5;
    }

    // TODO: changes state, but must not accept ether
    function setPassMark(uint256 m) external payable {
        passMark = m;
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Gradebook {
    uint256 public passMark = 50;

    function isPass(uint256 score) external view returns (bool) {
        return score >= passMark;
    }

    function curve(uint256 score) external pure returns (uint256) {
        return score + 5 > 100 ? 100 : score + 5;
    }

    function setPassMark(uint256 m) external {
        passMark = m;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "Gradebook", kind: "function", name: "isPass", inputs: ["uint256"], outputs: ["bool"], stateMutability: "view", message: "isPass is view" },
      { type: "abi", contract: "Gradebook", kind: "function", name: "curve", inputs: ["uint256"], outputs: ["uint256"], stateMutability: "pure", message: "curve is pure" },
      { type: "abi", contract: "Gradebook", kind: "function", name: "setPassMark", inputs: ["uint256"], stateMutability: "nonpayable", message: "setPassMark is non-payable" },
      { type: "regex", pattern: "passMark\\s*=\\s*m\\s*;", message: "setPassMark still stores the new mark" },
      { type: "noWarnings" },
    ],
  },
};
