import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "How many bytes is an `address`?", options: ["32", "20", "16", "160"], answer: 1, explain: "An address is 160 bits, i.e. 20 bytes, shown as 40 hex digits." },
  { q: "What is the difference between `address` and `address payable`?", options: ["The payable one is 32 bytes long, the plain one 20", "Only the plain one has `.balance` and `.code`", "Payable addresses cannot be compared with `==`", "Only the payable one has `transfer` and `send`"], answer: 3, explain: "Both are 20 bytes and both have `.balance`. The payable flavour adds the ether-sending members, which keeps accidental sends from compiling." },
  { q: "```solidity\nfunction pay(address to) public {\n    to.transfer(1 ether);\n}\n```\nWhy does this not compile?", options: ["`transfer` was removed from addresses in 0.8", "`to` is a plain address; wrap it as `payable(to)`", "`1 ether` is not a valid literal in this position", "The function must be declared `view` to send ether"], answer: 1, explain: "Only `address payable` has `transfer`. Use `payable(to)` once you decide the recipient may receive ether." },
  { q: "Which member runs another contract's code against the caller's own storage?", options: ["`staticcall`", "`call`", "`delegatecall`", "`codehash`"], answer: 2, explain: "`delegatecall` borrows code but keeps the caller's storage and msg.sender, which is powerful and dangerous." },
  { q: "Spot the bug: `target.call(abi.encodeWithSignature(\"ping()\"));` with the result ignored. What is wrong?", options: ["A failed low-level call returns false instead of reverting", "`call` needs a gas argument, otherwise it reverts at once", "`call` can only send ether and cannot be used to call functions", "`abi` is not available in 0.8, so the encoding fails"], answer: 0, explain: "Low-level calls report failure through a returned flag. Without checking it your code carries on as if nothing went wrong." },
  { q: "What does `address(this).balance` return?", options: ["The ether held by the contract, in wei", "The address of the caller", "The number of functions", "The contract's gas limit"], answer: 0, explain: "`.balance` is a `uint256` in wei, and `this` converted to an address is the contract itself." },
  { q: "What does the cast `Library(addr)` guarantee?", options: ["That a `Library` contract is really deployed at that `addr` address", "That `addr` is payable and can receive ether", "That calls through it will cost less gas than before", "Nothing; it just tells the compiler to treat it as a `Library`"], answer: 3, explain: "The cast is a promise from you to the compiler. It is not verified at runtime." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "balance-of": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Vault {
    // TODO: view balanceOf(address who) returns (uint256) -> the wei balance of who
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Vault {
    function balanceOf(address who) public view returns (uint256) {
        return who.balance;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "Vault", kind: "function", name: "balanceOf", inputs: ["address"], outputs: ["uint256"], stateMutability: "view", message: "Has view balanceOf(address) returning uint256" },
      { type: "regex", pattern: "return\\s+\\w+\\.balance\\s*;", message: "Returns the .balance member of the address" },
    ],
  },
};
