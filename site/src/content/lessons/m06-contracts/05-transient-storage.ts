import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "When is the content of transient storage reset to zero?", options: ["At the end of every block", "When the transaction ends", "When the contract is next called", "Only when the contract self-destructs"], answer: 1, explain: "Transient storage lasts for one transaction. After it, every slot reads zero again." },
  { q: "Which declaration is accepted by the compiler (0.8.28 or later)?", options: ["`mapping(address => uint256) transient seen;`", "`uint256[] transient items;`", "`uint256 transient count;`", "`uint256 transient count = 5;`"], answer: 2, explain: "Only value types may be transient, and they cannot have an in-place initialiser. Mappings and arrays are not yet supported." },
  { q: "Which opcodes read and write transient storage?", options: ["`SLOAD` and `SSTORE`", "`MLOAD` and `MSTORE`", "`CALLDATALOAD` and `RETURN`", "`TLOAD` and `TSTORE`"], answer: 3, explain: "EIP-1153 added TLOAD and TSTORE, mirroring SLOAD and SSTORE with a one-transaction lifetime." },
  { q: "Spot the bug: `modifier lock() { require(!locked); locked = true; _; }` with `bool transient locked;`. A router calls `claim()` twice in one transaction. What happens?", options: ["Both calls succeed, since transient storage resets between calls", "The compiler rejects the modifier as unsafe", "The first call reverts because `locked` is false", "The second call reverts, as the lock was never released"], answer: 3, explain: "The flag stays set until the transaction ends, so a second call in the same transaction sees it. Add `locked = false;` after `_;`." },
  { q: "`setRate(130)` is followed by `convert(2)` returning `amount * rate`, with `uint256 transient rate;`. What does `convert(2)` return if the two calls are in separate transactions?", options: ["260", "130", "0", "It reverts"], answer: 2, explain: "In the second transaction `rate` has been reset to zero, so the product is 0. In one combined transaction it would be 260." },
  { q: "Why does the lesson say to release a transient lock at the end of the call even though the chain will wipe it anyway?", options: ["The wipe only happens on testnets", "Otherwise the contract can only be entered once per transaction, which breaks batching", "The compiler requires every `transient` variable to be set back before exit", "Because releasing it refunds the gas for the original write"], answer: 1, explain: "Transactions that call the contract twice (routers, multicalls) would otherwise be blocked by a lock left over from the first call." },
  { q: "A function writes a `transient` variable. Which mutability can it have?", options: ["`pure`", "`view`", "Neither `pure` nor `view`", "Either, if the variable is `public`"], answer: 2, explain: "Writing transient storage is a state change, so it cannot be view or pure. Reading it also rules out pure." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "transient-lock": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Stipend {
    mapping(address => uint256) public owed;

    // TODO: keep this flag in transient storage instead of persistent storage
    bool locked;

    error Reentered();
    error TransferFailed();

    modifier noReentry() {
        // TODO: revert with Reentered() if locked, set the lock,
        // run the function body, then release the lock
        _;
    }

    function fund(address student) external payable {
        owed[student] += msg.value;
    }

    function claim() external noReentry {
        uint256 amount = owed[msg.sender];
        owed[msg.sender] = 0;
        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Stipend {
    mapping(address => uint256) public owed;

    bool transient locked;

    error Reentered();
    error TransferFailed();

    modifier noReentry() {
        if (locked) revert Reentered();
        locked = true;
        _;
        locked = false;
    }

    function fund(address student) external payable {
        owed[student] += msg.value;
    }

    function claim() external noReentry {
        uint256 amount = owed[msg.sender];
        owed[msg.sender] = 0;
        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "regex", pattern: "\\bbool\\s+transient\\s+locked\\s*;", message: "locked is a bool transient variable" },
      { type: "regex", pattern: "if\\s*\\(\\s*locked\\s*\\)\\s*revert\\s+Reentered\\s*\\(|require\\s*\\(\\s*!\\s*locked", message: "The modifier refuses entry while locked" },
      { type: "regex", pattern: "locked\\s*=\\s*true\\s*;", message: "The modifier sets the lock" },
      { type: "regex", pattern: "_\\s*;\\s*locked\\s*=\\s*false\\s*;", message: "The lock is released right after the body" },
    ],
  },
};
