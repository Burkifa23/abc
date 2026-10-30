import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "A refund loop calls `holder.call{value: amount}(\"\")` for each holder and reverts if one call fails. What is the danger?", options: ["One holder whose receive function reverts blocks the refunds of everybody else", "The loop sends the ether to the first holder repeatedly until the contract is empty", "The call returns `true` even when the recipient refuses the payment", "Only the organiser can ever read how much each person is owed"], answer: 0, explain: "A required call that fails reverts the whole transaction, so a single uncooperative recipient stalls everyone. Pull payments isolate each recipient." },
  { q: "What does the contract do in a pull-payment design when it decides someone should be paid?", options: ["It sends the ether as soon as possible, at the end of the same transaction, after all other work", "It records the amount in a mapping, and the person collects it later themselves", "It stores the recipient's address in an array that is looped over each day", "It emits an event and relies on the front end to do the transfer for them"], answer: 1, explain: "The contract only writes a debt into the ledger. Moving the ether is the recipient's own transaction, so the contract never waits on outside code." },
  { q: "Spot the bug: `(bool ok, ) = msg.sender.call{value: owed[msg.sender]}(\"\"); require(ok); owed[msg.sender] = 0;`", options: ["`owed` cannot be read inside the braces of a `call` expression, so the code fails to compile", "The mapping must be `private` for the withdraw to work", "`require(ok)` should be `assert(ok)` for a payment failure", "The ledger entry is cleared after the call, so re-entering pays twice"], answer: 3, explain: "Between the call and the zeroing, the recipient's code can call `withdraw` again and still see the full amount. Zero the entry before sending." },
  { q: "In `withdraw()`, the entry is zeroed and then the call fails, so the function reverts. What is `owed[msg.sender]` afterwards?", options: ["Zero, so the person has lost the claim for good and the money", "Half of the original amount, because gas is deducted from it", "Unchanged, since the revert undoes the zeroing as well", "Unknown until the next block is mined by a validator somewhere"], answer: 2, explain: "A revert undoes every state change in the transaction, including the zeroing. The person can fix their wallet and try again." },
  { q: "Which cost does the withdrawal pattern add?", options: ["Contracts can no longer hold any ether between transactions at all", "Every payout needs a signature from the contract's organiser first", "It is not possible to store debts for more than one account", "Recipients must learn about the debt and pay gas to collect it"], answer: 3, explain: "Pull payments shift effort to the recipient, who has to notice that money is waiting and send a transaction. Events help front ends with the notice." },
  { q: "A contract pays 40 prize winners in a `for` loop over an array. Besides a reverting recipient, what else can make it fail?", options: ["Loops are forbidden once a contract has more than 32 state variables", "With a large enough list, it needs more gas than one block allows", "The loop cannot use `call` because it needs `transfer` to run", "The EVM stops loops after 16 iterations unless `unchecked` is used"], answer: 1, explain: "A loop whose length grows with stored data can eventually exceed the block gas limit. Recording debts and letting people pull keeps each transaction small." },
  { q: "Why does `cancel()` in the pull version only set a flag, rather than refunding?", options: ["Flags are the only values that can change after deployment", "Because refunds are not possible while a show is still on sale and tickets can be bought", "A single write costs the same small gas for any number of buyers", "To prevent the organiser from ever seeing the buyers' addresses"], answer: 2, explain: "A single write has a fixed cost, so cancelling cannot run out of gas as the buyer list grows. Each buyer then collects their own money." },
];

const head = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TicketDesk {
    address public immutable organiser;
    bool public cancelled;
    mapping(address => uint256) public paid;
    mapping(address => uint256) public owed;

    error NotOrganiser();
    error StillOn();
    error NothingOwed();
    error PayoutFailed();

    constructor() {
        organiser = msg.sender;
    }

    function buy() external payable {
        paid[msg.sender] += msg.value;
    }

    function cancel() external {
        if (msg.sender != organiser) revert NotOrganiser();
        cancelled = true;
    }

    function claimRefund() external {
        if (!cancelled) revert StillOn();
        owed[msg.sender] += paid[msg.sender];
        paid[msg.sender] = 0;
    }

`;

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  pull: {
    starter: `${head}    // TODO: let a person collect what they are owed.
    // - nothing owed: revert NothingOwed()
    // - zero the entry BEFORE sending
    // - send with call{value: ...}; revert PayoutFailed() if it fails
    function withdraw() external {}
}
`,
    solution: `${head}    function withdraw() external {
        uint256 amount = owed[msg.sender];
        if (amount == 0) revert NothingOwed();

        owed[msg.sender] = 0;

        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert PayoutFailed();
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "TicketDesk", kind: "function", name: "withdraw", inputs: [], outputs: [], stateMutability: "nonpayable", message: "Has withdraw() with no arguments" },
      { type: "abi", contract: "TicketDesk", kind: "function", name: "owed", inputs: ["address"], outputs: ["uint256"], stateMutability: "view", message: "Has the public owed(address) ledger" },
      { type: "regex", pattern: "revert\\s+NothingOwed\\s*\\(", message: "Reverts with NothingOwed when nothing is owed" },
      { type: "regex", pattern: "owed\\s*\\[\\s*msg\\.sender\\s*\\]\\s*=\\s*0\\s*;[\\s\\S]*\\.call\\s*\\{\\s*value\\s*:", message: "Zeroes the ledger entry before the call{value: ...}" },
      { type: "regex", pattern: "if\\s*\\(\\s*!\\s*\\w+\\s*\\)\\s*revert\\s+PayoutFailed\\s*\\(|require\\s*\\(\\s*\\w+\\s*,\\s*PayoutFailed\\s*\\(", message: "Reverts with PayoutFailed when the send fails" },
    ],
  },
};
