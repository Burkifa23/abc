import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "How many bytes is an `address`?", options: ["32", "20", "16", "160"], answer: 1, explain: "An address is 160 bits, i.e. 20 bytes, shown as 40 hex digits." },
  { q: "What is the difference between `address` and `address payable`?", options: ["The payable one is 32 bytes long", "Only the payable one has the `transfer` and `send` members", "Only the plain one has `.balance`", "Payable addresses cannot be compared"], answer: 1, explain: "Both are 20 bytes and both have `.balance`. The payable flavour adds the ether-sending members, which keeps accidental sends from compiling." },
  { q: "```solidity\nfunction pay(address to) public {\n    to.transfer(1 ether);\n}\n```\nWhy does this not compile?", options: ["`transfer` was removed", "`to` is a plain address; it needs `payable(to).transfer(...)`", "`1 ether` is not a valid literal", "The function must be `view`"], answer: 1, explain: "Only `address payable` has `transfer`. Use `payable(to)` once you decide the recipient may receive ether." },
  { q: "Which member runs another contract's code against the caller's own storage?", options: ["`staticcall`", "`call`", "`delegatecall`", "`codehash`"], answer: 2, explain: "`delegatecall` borrows code but keeps the caller's storage and msg.sender, which is powerful and dangerous." },
  { q: "Spot the bug: `target.call(abi.encodeWithSignature(\"ping()\"));` with the result ignored. What is wrong?", options: ["`call` needs a gas argument", "A failed low-level call returns false instead of reverting, so ignoring it hides the failure", "`call` can only send ether", "`abi` is not available in 0.8"], answer: 1, explain: "Low-level calls report failure through a returned flag. Without checking it your code carries on as if nothing went wrong." },
  { q: "What does `address(this).balance` return?", options: ["The ether held by the contract, in wei", "The address of the caller", "The number of functions", "The contract's gas limit"], answer: 0, explain: "`.balance` is a `uint256` in wei, and `this` converted to an address is the contract itself." },
  { q: "What does the cast `Library(addr)` guarantee?", options: ["That a `Library` is deployed at `addr`", "That `addr` is payable", "Nothing; it only tells the compiler to treat the address as a `Library`", "That the call will cost less gas"], answer: 2, explain: "The cast is a promise from you to the compiler. It is not verified at runtime." },
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
