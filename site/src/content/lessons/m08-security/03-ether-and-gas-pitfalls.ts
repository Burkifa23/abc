import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Which of these can put ether into a contract that has no `receive` or `fallback` function?", options: ["Nothing, since any transfer to such a contract reverts", "A plain `call` with a value, because `call` ignores a missing receive function and simply skips the check", "`selfdestruct(target)` from another contract, which sends its balance without running code", "A `transfer` from a wallet, which uses a special stipend rule"], answer: 2, explain: "`selfdestruct` forwards the dying contract's balance to the target without executing the target's code. Block rewards and pre-funding a predictable address do the same." },
  { q: "Why is `require(address(this).balance == totalDeposits)` a poor invariant?", options: ["`totalDeposits` has to be stored in a mapping before it can be compared with a balance", "Comparing a balance with `==` costs far more gas than `>=`", "The `balance` member is only available inside `view` functions", "Anyone can break it by forcing in one wei, and it then fails forever"], answer: 3, explain: "Ether can be pushed into a contract without calling it, so the real balance can exceed your own accounting. Track what you received yourself and treat the balance as at least that." },
  { q: "What is the main reason `transfer` and `send` are discouraged today?", options: ["Their fixed 2300-gas stipend can be too little for honest recipients after gas repricing", "They cost more gas than `call` for every single recipient, which makes large payouts too costly to run", "They do not work with externally owned accounts at all", "They always forward the entire remaining gas to the recipient"], answer: 0, explain: "Repricing (EIP-1884, EIP-2929) made operations like storage reads dearer, so a legitimate contract wallet can fail to receive. The stipend is no reliable defence either." },
  { q: "Spot the bug: `payable(student).call{value: grant}(\"\"); balance[student] = 0;`", options: ["`call` can only be used on addresses that currently hold no ether, so this line always fails", "The returned success flag is ignored, so a failed send looks like a paid grant", "The assignment must appear before the `call` for the code to compile", "`call` needs the `payable` keyword placed after its closing parenthesis"], answer: 1, explain: "Low-level calls return `false` on failure instead of reverting. If you do not check it, the ledger says the student was paid when they were not." },
  { q: "A contract loops `for (uint256 i = 0; i < members.length; i++)` and anyone may call `join()` to append to `members`. What is the long-term risk?", options: ["The array will be cleared automatically as soon as it reaches 1024 entries, so the loop stays short", "The loop's gas cost can exceed the block limit, so the function can never succeed", "Solidity stops the loop at the 256th iteration for safety", "Only `view` callers are affected; state-changing calls skip the loop"], answer: 1, explain: "Each iteration costs gas, and the array only grows. Once one pass needs more gas than a block holds, the function is stuck, and funds depending on it are locked." },
  { q: "Why is the call depth limit of 1024 no longer a practical attack?", options: ["The limit was raised to a million nested calls in the most recent hard fork, so it cannot be reached", "The 63/64 gas rule makes reaching that depth impossible within any block's gas", "Call depth is checked only by the compiler, not at run time", "Contracts can no longer call other contracts after EIP-150"], answer: 1, explain: "Since EIP-150 each call may forward at most 63/64 of the remaining gas, so the gas needed to nest 1024 levels deep exceeds anything a block can provide." },
  { q: "Which is the most robust way to pay 300 students from one contract?", options: ["Loop over all students and use `transfer` to pay each one, since it reverts on failure", "Loop over them with `send` and ignore any single failure", "Record what each student is owed and let each pull their own money", "Call each student with 2300 gas so that no one can re-enter"], answer: 2, explain: "Pull payments keep one student's failing wallet from blocking anyone else, and avoid a loop that can outgrow the block gas limit." },
];

const head = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ScholarshipPayout {
    address public immutable treasurer;

    error NotTreasurer();
    error SendFailed();

    constructor() {
        treasurer = msg.sender;
    }

    receive() external payable {}

`;

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "checked-call": {
    starter: `${head}    // TODO: replace transfer with a call{value: ...} and check the result.
    // If the send fails, revert with SendFailed().
    function pay(address payable student, uint256 amount) external {
        if (msg.sender != treasurer) revert NotTreasurer();
        student.transfer(amount);
    }
}
`,
    solution: `${head}    function pay(address payable student, uint256 amount) external {
        if (msg.sender != treasurer) revert NotTreasurer();
        (bool ok, ) = student.call{value: amount}("");
        if (!ok) revert SendFailed();
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "noWarnings" },
      { type: "abi", contract: "ScholarshipPayout", kind: "function", name: "pay", inputs: ["address", "uint256"], outputs: [], stateMutability: "nonpayable", message: "Has pay(address, uint256)" },
      { type: "regex", pattern: "\\.call\\s*\\{\\s*value\\s*:\\s*amount\\s*\\}", message: "Sends the amount with call{value: amount}" },
      { type: "regex", pattern: "revert\\s+SendFailed\\s*\\(", message: "Reverts with SendFailed when the call fails" },
      { type: "regex", pattern: "^(?![\\s\\S]*\\.(transfer|send)\\s*\\()[\\s\\S]*$", message: "No longer uses transfer or send" },
    ],
  },
};
