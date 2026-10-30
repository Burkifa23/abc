import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

const escrow = (modifierBody: string) => `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TextbookEscrow {
    enum State { Listed, Locked, Delivered, Closed }

    State public state;
    address payable public immutable seller;
    address payable public buyer;
    uint256 public immutable price;

    error WrongState(State actual);
    error NotSeller();
    error NotBuyer();
    error OddDeposit();
    error WrongDeposit();
    error TransferFailed();

    constructor() payable {
        seller = payable(msg.sender);
        price = msg.value / 2;
        if (price * 2 != msg.value) revert OddDeposit();
    }

${modifierBody}

    modifier onlySeller() {
        if (msg.sender != seller) revert NotSeller();
        _;
    }

    modifier onlyBuyer() {
        if (msg.sender != buyer) revert NotBuyer();
        _;
    }

    function abort() external onlySeller inState(State.Listed) {
        state = State.Closed;
        _send(seller, address(this).balance);
    }

    function confirmPurchase() external payable inState(State.Listed) {
        if (msg.value != 2 * price) revert WrongDeposit();
        buyer = payable(msg.sender);
        state = State.Locked;
    }

    function confirmReceived() external onlyBuyer inState(State.Locked) {
        state = State.Delivered;
        _send(buyer, price);
    }

    function payOutSeller() external onlySeller inState(State.Delivered) {
        state = State.Closed;
        _send(seller, 3 * price);
    }

    function _send(address payable to, uint256 amount) private {
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
`;

export const quiz: Question[] = [
  { q: "Why is a single `enum State` better than separate booleans like `isLocked` and `isDone`?", options: ["Booleans cannot be stored in contract storage at all", "Enums use no storage at all, so deployment becomes much cheaper", "Only one stage can hold at once, so impossible mixes vanish", "The compiler refuses to read more than one boolean per function call"], answer: 2, explain: "With flags, nothing stops `isLocked` and `isDone` both being true. An enum holds one value, so every state is a deliberate, named stage." },
  { q: "In the escrow, the seller deposits 2p and the buyer deposits 2p. After `confirmReceived` and `payOutSeller`, how much does the seller receive in total from the contract?", options: ["p, the price of the book and nothing else", "2p, only their own deposit", "4p, the entire balance of the contract", "3p, their own deposit plus the price"], answer: 3, explain: "The buyer gets p back at `confirmReceived`, leaving 3p in the contract. The seller then takes 3p: their own 2p plus the buyer's price p." },
  { q: "Why does `confirmReceived` set `state = State.Delivered` before calling `_send`?", options: ["`_send` reads the state to decide how much ether to transfer", "The compiler requires every assignment to come before any call", "Events are only emitted after the state has been changed in storage", "A callback into the contract finds the new state and reverts"], answer: 3, explain: "Updating state first means a reentrant call meets the new state and the modifier rejects it. Sending first would leave a window for repeating the step." },
  { q: "Spot the bug: `modifier inState(State state) { if (state != state) revert WrongState(state); _; }`", options: ["`revert` cannot be placed inside the body of a modifier at all", "The parameter shadows the state, so the guard never fires", "A modifier is not allowed to take an `enum` as a parameter", "The `_;` has to come before the `if` statement in that modifier"], answer: 1, explain: "Inside the modifier the name `state` refers to the parameter, so `state != state` is always false and the guard does nothing. Name the parameter differently, for example `expected`." },
  { q: "Why do both the buyer and the seller put down a deposit worth twice the price?", options: ["Dishonesty gains nothing, since failure locks both deposits up", "The EVM requires an even amount for any payable function call", "Gas costs for the transfers are paid out of the extra deposit", "The extra funds earn interest while locked in the contract itself"], answer: 0, explain: "If either party stops cooperating, both deposits stay locked. Cheating costs them money and earns nothing, so the best move is to complete the sale." },
  { q: "What is the right way to end the lifecycle of this contract on today's Ethereum?", options: ["Move to a `Closed` state that makes every function revert", "Call `selfdestruct` so the code is removed from the chain", "Set the price to zero so that nobody uses it again", "Delete the `state` variable from the contract at runtime"], answer: 0, explain: "Since EIP-6780 (Cancun), `selfdestruct` no longer removes code or storage except in the creating transaction. A terminal state is the dependable way to finish." },
  { q: "A buyer locks their deposit and then never confirms receipt. What does this version of the contract do?", options: ["It returns the buyer's deposit to them after waiting 24 hours", "It sends the whole balance over to the seller automatically", "Nothing happens; funds stay locked, a known limit", "It lets any third party step in and take over the purchase"], answer: 2, explain: "The example has no deadline or arbiter, so the deposits remain locked. A production design would add a timeout or dispute path." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "in-state": {
    starter: escrow(`    // TODO: revert with WrongState(state) unless the contract is in the expected stage
    modifier inState(State expected) {
        _;
    }`),
    solution: escrow(`    modifier inState(State expected) {
        if (state != expected) revert WrongState(state);
        _;
    }`),
    checks: [
      { type: "compiles" },
      { type: "regex", pattern: "modifier\\s+inState\\s*\\(\\s*State\\s+\\w+\\s*\\)", message: "Declares modifier inState(State ...)" },
      { type: "regex", pattern: "state\\s*!=\\s*\\w+", message: "Compares the current state with the expected one" },
      { type: "regex", pattern: "revert\\s+WrongState\\s*\\(\\s*state\\s*\\)", message: "Reverts with WrongState(state)" },
      { type: "regex", pattern: "revert\\s+WrongState[^;]*;\\s*_\\s*;", message: "Runs the function body (_;) after the check" },
    ],
  },
};
