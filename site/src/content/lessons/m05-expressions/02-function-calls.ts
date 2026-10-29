import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Inside contract `A`, you write `helper(5)` where `helper` is another function of `A`. What kind of call is this?", options: ["An external call that creates a new transaction", "An internal call, compiled to a jump", "A delegate call", "A low-level call"], answer: 1, explain: "A bare function name is an internal call. No message is sent, memory is kept, and msg.sender stays the same." },
  { q: "Inside `Desk.whoViaThis()`, `return this.who();` is used and `who()` returns `msg.sender`. What does it return?", options: ["The address of the user who called `whoViaThis`", "The zero address", "It does not compile", "The address of the `Desk` contract itself"], answer: 3, explain: "`this.who()` is an external message call from the contract to itself, so inside `who` the sender is the contract." },
  { q: "Spot the bug: `cards.topUp{value: msg.value};` is meant to load a student's meal card.", options: ["`msg.value` is not allowed in curly braces", "`topUp` must be an internal function to receive ether", "The call parentheses are missing, so nothing runs", "`value` should be `wei`"], answer: 2, explain: "The braces only record the settings. The call is performed by the parentheses: `cards.topUp{value: msg.value}(cardId);`." },
  { q: "Why does the `{value: ...}` option need the called function to be `payable`?", options: ["Only payable functions can accept ether", "Because otherwise the compiler cannot find the function", "Payable functions are cheaper to call", "It does not; any function accepts value"], answer: 0, explain: "Only payable functions can receive ether. The compiler therefore refuses to attach a value to a call of a non-payable one." },
  { q: "Given `function setOwed(uint256 studentId, uint256 amount)`, which call is valid?", options: ["`setOwed({amount: 0, studentId: 7});`", "`setOwed(amount: 0, studentId: 7);`", "`setOwed({a: 0, s: 7});`", "`setOwed([0, 7]);`"], answer: 0, explain: "Named arguments go in curly braces, may come in any order, and must use the declared parameter names." },
  { q: "A high-level call `c.read()` targets an address that holds no code, and `read()` returns a `uint256`. What happens?", options: ["It succeeds and returns 0", "It silently does nothing", "The ether is refunded and execution continues", "It reverts: nothing to decode"], answer: 3, explain: "Empty code returns empty data, so the ABI decoder fails and the call reverts. For functions that return nothing, the compiler's automatic extcodesize check still protects you." },
  { q: "What does the declaration `function pickFirst(uint256 first, uint256) public pure returns (uint256)` mean?", options: ["It does not compile: every parameter needs a name", "The second parameter is optional for callers who omit it", "The second parameter exists but cannot be used in the body", "The second parameter is passed by reference, not by value"], answer: 2, explain: "Names can be omitted. The value is still passed, but the body has no way to refer to it." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "fees-desk-call": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBursary {
    function pay(uint256 studentId, uint256 term) external payable;
}

contract FeesDesk {
    IBursary public bursary;

    constructor(IBursary b) {
        bursary = b;
    }

    function payFor(uint256 studentId, uint256 term) external payable {
        // TODO: call bursary.pay, forwarding all the ether received,
        // with the arguments passed by name (term first)
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBursary {
    function pay(uint256 studentId, uint256 term) external payable;
}

contract FeesDesk {
    IBursary public bursary;

    constructor(IBursary b) {
        bursary = b;
    }

    function payFor(uint256 studentId, uint256 term) external payable {
        bursary.pay{value: msg.value}({term: term, studentId: studentId});
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "FeesDesk", kind: "function", name: "payFor", inputs: ["uint256", "uint256"], stateMutability: "payable", message: "payFor(uint256,uint256) is payable" },
      { type: "regex", pattern: "\\.pay\\s*\\{\\s*value\\s*:\\s*msg\\.value\\s*\\}", message: "Forwards msg.value with pay{value: msg.value}" },
      { type: "regex", pattern: "\\}\\s*\\(\\s*\\{\\s*(studentId|term)\\s*:", message: "Passes the arguments by name inside ({ ... })" },
    ],
  },
};
