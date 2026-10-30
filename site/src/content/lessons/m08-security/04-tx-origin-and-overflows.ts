import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "A wallet calls contract A, and A calls contract B. Inside B, what are `msg.sender` and `tx.origin`?", options: ["`msg.sender` is the wallet and `tx.origin` is contract A", "Both are the wallet that signed the transaction", "Both are contract A, the account that made the latest call", "`msg.sender` is contract A and `tx.origin` is the wallet"], answer: 3, explain: "`msg.sender` is the immediate caller of the current call, while `tx.origin` is the account that signed the whole transaction, no matter how many contracts sit in between." },
  { q: "Spot the bug: `function sweep(address payable to) external { require(tx.origin == owner); to.transfer(address(this).balance); }`", options: ["A contract the owner calls can relay a call here and pass the check", "`transfer` can only send fixed amounts, never a full balance", "`require` cannot compare two addresses in Solidity", "The function must be `view` because it reads the contract's balance"], answer: 0, explain: "Any contract the owner interacts with can call `sweep`. `tx.origin` is still the owner, so the check passes while the funds go to the attacker. Use `msg.sender`." },
  { q: "Why is `require(tx.origin == msg.sender)` no longer a reliable test that the caller is a plain wallet?", options: ["`tx.origin` was removed from the language in version 0.8, so the expression no longer compiles at all", "Contracts can now forge their own `msg.sender` using EIP-7702", "An externally owned account can carry delegated code under EIP-7702 and still satisfy it", "The check is correct, because wallets never run code"], answer: 2, explain: "EIP-7702 lets an EOA attach code to itself, so an account that runs code can still be both the signer and the direct caller. The comparison does not prove there is no code." },
  { q: "What does this evaluate to? `uint8 a = 200; uint8 b = 100; unchecked { return a + b; }`", options: ["44, because 300 wraps around modulo 256 inside `unchecked`", "It reverts with a panic error because 300 does not fit", "255, because the result is capped at the largest value", "300, because the return type is widened automatically"], answer: 0, explain: "Inside `unchecked`, overflow wraps around. 300 modulo 256 is 44. Outside `unchecked`, Solidity 0.8 would revert instead." },
  { q: "A contract keeps `uint8 public enrolled;` and each `join()` does `enrolled += 1;` in normal checked code. What happens on the 256th call?", options: ["`enrolled` wraps to 0 and the next student is counted again", "The transaction reverts, and every later `join()` reverts too", "`enrolled` stays at 255 and the call succeeds without changing it", "The compiler adds a second byte to the variable on the fly"], answer: 1, explain: "Checked arithmetic reverts on overflow. The counter cannot move beyond 255, so the contract is stuck unless another function lowers it." },
  { q: "After `delete grades;` on a `mapping(address => uint256)[] grades`, which statement is true?", options: ["The array length becomes zero and every mapping entry inside it is also set back to zero", "The call reverts, since deleting an array of mappings is not allowed", "The array is emptied but old mapping entries can reappear when slots are reused", "Only the first mapping is cleared; the others remain in place"], answer: 2, explain: "A mapping does not know its keys, so it cannot be zeroed. After the array grows again, the old values in those slots can be read once more." },
  { q: "Why should a generic `forward(address target, bytes data)` contract hold no permissions?", options: ["Callers would borrow its identity, since every target sees the relay as `msg.sender`", "It costs more gas to call from an account that holds permissions, so a relay is never given any", "Forwarding contracts cannot be given roles by the EVM", "The compiler refuses to deploy relays that own tokens or roles"], answer: 0, explain: "Targets see the relay as `msg.sender`, so whatever the relay may do, every caller can do through it. A powerless forwarder cannot be abused to gain authority." },
];

const head = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DepartmentWallet {
    address public immutable head;

    error NotHead();
    error SendFailed();

    constructor() {
        head = msg.sender;
    }

    receive() external payable {}

`;

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "origin-fix": {
    starter: `${head}    // TODO: this authorises the head with tx.origin, so a contract that the head
    // is tricked into calling can relay a payOut. Check the immediate caller instead.
    function payOut(address payable to, uint256 amount) external {
        if (tx.origin != head) revert NotHead();
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert SendFailed();
    }
}
`,
    solution: `${head}    function payOut(address payable to, uint256 amount) external {
        if (msg.sender != head) revert NotHead();
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert SendFailed();
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "DepartmentWallet", kind: "function", name: "payOut", inputs: ["address", "uint256"], outputs: [], stateMutability: "nonpayable", message: "Has payOut(address, uint256)" },
      { type: "regex", pattern: "msg\\.sender\\s*(!=|==)\\s*head|head\\s*(!=|==)\\s*msg\\.sender", message: "Compares msg.sender with head" },
      { type: "regex", pattern: "^(?![\\s\\S]*tx\\.origin)[\\s\\S]*$", message: "No longer mentions tx.origin" },
      { type: "regex", pattern: "revert\\s+NotHead\\s*\\(", message: "Still reverts with NotHead for other callers" },
    ],
  },
};
