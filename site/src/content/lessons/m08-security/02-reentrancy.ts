import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Why does sending ether to a contract address create a reentrancy risk?", options: ["Ether transfers are always processed only after the whole sending function has finished and returned", "The recipient's receive or fallback code runs while the sender is paused", "The EVM lets a recipient edit the sender's storage during a transfer", "A transfer to a contract skips the sender's `require` checks entirely"], answer: 1, explain: "Sending ether to a contract executes its `receive` or `fallback` function immediately, in the middle of the sender's function. That code can call back in before the sender has finished." },
  { q: "Spot the bug: `(bool ok, ) = msg.sender.call{value: amt}(\"\"); require(ok); balanceOf[msg.sender] -= amt;`", options: ["`balanceOf` is updated after the call, so a reentrant call sees the old balance", "`require(ok)` must be written before the call itself, never after it, or the compiler objects", "The `-=` operator cannot be used on mapping values in Solidity", "`msg.sender` has to be wrapped in `payable(...)` before `call` works"], answer: 0, explain: "The recipient can call back before the subtraction runs and withdraw the same balance again. The effect (the subtraction) must come before the interaction (the call)." },
  { q: "In checks-effects-interactions, which of these belongs to the *effects* step?", options: ["Reading `msg.value` to verify that enough ether was sent", "Calling another contract's `transfer` function to pay the user", "Setting `credit[msg.sender] = 0` before anything is sent", "Sending the payout with `call` once the other writes are done"], answer: 2, explain: "Effects are the writes to this contract's own state. Checks come first, and interactions with other contracts or accounts come last." },
  { q: "Two functions share `credit`. Only `claim()` carries `nonReentrant`; `moveCredit()` does not. What can an attacker do from `receive()`?", options: ["Nothing, because the lock on `claim()` blocks every function that uses `credit`, so the shared state stays protected", "Re-enter `claim()` freely, because the lock only works on `view` functions", "Call `moveCredit()` while `claim()` is mid-call and shift credit that has not been cleared", "Unlock the guard by calling `claim()` with a zero value"], answer: 2, explain: "The guard protects only the functions that carry it. `moveCredit()` can run while `claim()` is paused and still sees the full credit, which is cross-function reentrancy." },
  { q: "A `claim()` follows CEI and reverts with `PayoutFailed` when the `call` returns false. What happens to the zeroed credit when the payout fails?", options: ["It stays at zero after the revert, so the student permanently loses the money they were owed", "It is restored, because the revert undoes the whole transaction's writes", "It is restored only if the function was marked `payable`", "It moves to the contract owner, who can pay the student manually"], answer: 1, explain: "A revert discards all state changes made in the transaction, so the zeroing is rolled back with it. The honest student can try again later." },
  { q: "What is read-only reentrancy?", options: ["A reentrant call that can only read storage, which is harmless", "A `view` function that edits state through an inline assembly block", "Calling `claim()` from a `staticcall`, which blocks every state change and so cannot be exploited", "Another contract trusting a `view` result read while the books are out of date"], answer: 3, explain: "In the middle of an external call the contract's state may be inconsistent. A `view` function read in that window returns stale data, and whoever relies on it can be fooled." },
  { q: "Which statement about a `nonReentrant` guard is correct?", options: ["It makes the checks-effects-interactions order unnecessary, so the effects can safely follow the call", "It can use transient storage since 0.8.24, which is cleared when the transaction ends", "It protects every function in the contract once it is added to one", "It blocks reentrancy through `delegatecall` and `staticcall` only"], answer: 1, explain: "Transient storage was added with Cancun and is cleared at the end of each transaction, so it suits a lock flag cheaply. A guard covers only the functions that use it and complements CEI rather than replacing it." },
];

const head = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BursaryPool {
    mapping(address => uint256) public credit;

    error NothingToPay();
    error PayoutFailed();

    function deposit() external payable {
        credit[msg.sender] += msg.value;
    }

`;

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  cei: {
    starter: `${head}    // TODO: this pays first and clears the ledger afterwards, so a recipient
    // contract can call claim() again before its credit is zero.
    // Reorder it: check, then update the state, then send.
    function claim() external {
        uint256 amount = credit[msg.sender];
        if (amount == 0) revert NothingToPay();

        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert PayoutFailed();

        credit[msg.sender] = 0;
    }
}
`,
    solution: `${head}    function claim() external {
        uint256 amount = credit[msg.sender];
        if (amount == 0) revert NothingToPay();

        credit[msg.sender] = 0;

        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert PayoutFailed();
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "BursaryPool", kind: "function", name: "claim", inputs: [], outputs: [], stateMutability: "nonpayable", message: "Has claim() with no arguments" },
      { type: "regex", pattern: "credit\\s*\\[\\s*msg\\.sender\\s*\\]\\s*=\\s*0\\s*;[\\s\\S]*\\.call\\s*\\{", message: "Clears the ledger entry before the external call" },
      { type: "regex", pattern: "\\.call\\s*\\{\\s*value\\s*:\\s*amount\\s*\\}", message: "Still sends `amount` with call{value: amount}" },
      { type: "regex", pattern: "if\\s*\\(\\s*!\\s*\\w+\\s*\\)\\s*revert\\s+PayoutFailed\\s*\\(|require\\s*\\(\\s*\\w+\\s*,\\s*PayoutFailed\\s*\\(", message: "Still reverts with PayoutFailed when the send fails" },
    ],
  },
};
