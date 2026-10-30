import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "A bidder's contract has a `receive` function that always reverts. If `bid()` refunds the old leader directly, what happens once that contract is the leader?", options: ["Every later bid reverts as well, so nobody can ever outbid it", "The old leader loses the refund but bidding carries on", "The refund goes to the next bidder in line instead of the contract", "The auction ends early with the attacker declared the winner"], answer: 0, explain: "The refund call fails, and a failed required call reverts `bid()` for everyone. One party's refusal to accept ether blocks the whole auction." },
  { q: "Why does `withdraw()` set `pendingReturns[msg.sender] = 0` before sending the ether?", options: ["Solidity refuses to send ether while a mapping entry is non-zero", "Zero values are cheaper to send, so it saves gas on the transfer", "So that the ledger is already empty by the time `settle()` runs", "A reentrant second call then finds nothing left to withdraw"], answer: 3, explain: "If the recipient's code calls `withdraw()` again while receiving the ether, the entry must already read zero. Clearing after sending would let it be paid repeatedly." },
  { q: "Which statement about `transfer` and `send` is correct?", options: ["Each forwards a fixed 2300 gas, which is discouraged; use `call`", "They are the recommended choice, because a recipient can never re-enter", "They forward all remaining gas, exactly like `call` does", "They only work for contracts and never for ordinary accounts"], answer: 0, explain: "The 2300-gas stipend can break honest contract recipients as gas costs change and is not a dependable defence. `call` plus checks-effects-interactions is the recommended approach." },
  { q: "Spot the bug: `uint256 a = pendingReturns[msg.sender]; (bool ok, ) = msg.sender.call{value: a}(\"\"); require(ok); pendingReturns[msg.sender] = 0;`", options: ["`require(ok)` cannot be written straight after a `call` expression", "The ledger is cleared late, so a reentrant call gets paid twice", "`msg.sender` cannot receive any ether that was sent using `call`", "The function should be marked `view` because it reads a mapping"], answer: 1, explain: "Zeroing after the call leaves a window in which the recipient re-enters and still sees the full amount. The entry must be cleared before sending." },
  { q: "In `bid()`, why add the previous leader's bid to `pendingReturns` instead of sending it back?", options: ["The EVM cannot send ether to an address that bid earlier", "Only a mapping can hold the current leader for this auction", "Sending ether always costs more gas than writing a mapping entry", "It records a debt that each bidder later collects themselves"], answer: 3, explain: "This is the withdraw (pull) pattern: the contract only records the debt. Collecting it is each person's own transaction, and a failing recipient hurts only themselves." },
  { q: "What does `settle()` do besides checking the deadline?", options: ["Resets `pendingReturns` for every bidder who took part in it", "Sets `settled` before paying, so the fund is not paid twice", "Refunds all of the outbid bidders inside one single loop", "Extends the deadline whenever the final bid looks too low"], answer: 1, explain: "Setting `settled` first makes a second call revert with `AlreadySettled`. Refunds stay in the ledger for each bidder to withdraw." },
  { q: "A bidder sends 3 ether with `bid()` while the leading bid is also 3 ether. What happens?", options: ["The new bid wins the tie, since it arrived later", "The bid is accepted and added onto the previous bid", "The ether stays in the contract as an unrequested gift", "It reverts with `BidTooLow` and returns the ether"], answer: 3, explain: "The check is `msg.value <= leadingBid`, so an equal bid is rejected. The revert returns the ether to the sender." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  withdraw: {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RoomAuction {
    uint256 public immutable closesAt;
    address public leader;
    uint256 public leadingBid;
    mapping(address => uint256) public pendingReturns;

    error TooLate();
    error BidTooLow(uint256 leadingBid);

    constructor(uint256 durationSeconds) {
        closesAt = block.timestamp + durationSeconds;
    }

    function bid() external payable {
        if (block.timestamp >= closesAt) revert TooLate();
        if (msg.value <= leadingBid) revert BidTooLow(leadingBid);
        if (leader != address(0)) {
            pendingReturns[leader] += leadingBid;
        }
        leader = msg.sender;
        leadingBid = msg.value;
    }

    // TODO: let an outbid bidder pull their money back.
    // - nothing owed: return false
    // - clear the ledger entry BEFORE sending
    // - send with call{value: ...}
    // - if the send fails, restore the entry and return false
    function withdraw() external returns (bool) {
        return false;
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RoomAuction {
    uint256 public immutable closesAt;
    address public leader;
    uint256 public leadingBid;
    mapping(address => uint256) public pendingReturns;

    error TooLate();
    error BidTooLow(uint256 leadingBid);

    constructor(uint256 durationSeconds) {
        closesAt = block.timestamp + durationSeconds;
    }

    function bid() external payable {
        if (block.timestamp >= closesAt) revert TooLate();
        if (msg.value <= leadingBid) revert BidTooLow(leadingBid);
        if (leader != address(0)) {
            pendingReturns[leader] += leadingBid;
        }
        leader = msg.sender;
        leadingBid = msg.value;
    }

    function withdraw() external returns (bool) {
        uint256 amount = pendingReturns[msg.sender];
        if (amount == 0) return false;

        pendingReturns[msg.sender] = 0;

        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) {
            pendingReturns[msg.sender] = amount;
            return false;
        }
        return true;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "RoomAuction", kind: "function", name: "withdraw", inputs: [], outputs: ["bool"], stateMutability: "nonpayable", message: "Has withdraw() returns (bool)" },
      { type: "regex", pattern: "pendingReturns\\s*\\[\\s*msg\\.sender\\s*\\]\\s*=\\s*0\\s*;", message: "Clears the caller's ledger entry" },
      { type: "regex", pattern: "msg\\.sender\\.call\\s*\\{\\s*value\\s*:", message: "Sends the ether with call{value: ...}" },
      { type: "regex", pattern: "pendingReturns\\s*\\[\\s*msg\\.sender\\s*\\]\\s*=\\s*0\\s*;[\\s\\S]*\\.call\\s*\\{", message: "Clears the entry before the external call" },
      { type: "regex", pattern: "return\\s+true\\s*;", message: "Returns true when the payment succeeded" },
    ],
  },
};
