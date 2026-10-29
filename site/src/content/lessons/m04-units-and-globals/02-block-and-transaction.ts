import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Ama calls contract A, and A calls contract B. Inside B, what are `msg.sender` and `tx.origin`?", options: ["Both are Ama", "Both are A", "`msg.sender` is A and `tx.origin` is Ama", "`msg.sender` is Ama and `tx.origin` is A"], answer: 2, explain: "msg.sender is the direct caller of the current call, which is A. tx.origin is the account that signed the whole transaction, which is Ama." },
  { q: "Spot the bug: `function withdraw() external { require(tx.origin == treasurer); /* send funds */ }`. What is wrong?", options: ["Any contract the treasurer calls can act as them via tx.origin", "`require` cannot take an address comparison as its condition", "`tx.origin` is always zero except inside a constructor", "The function must be declared `view`, since it only reads state"], answer: 0, explain: "tx.origin stays the signer through the whole call chain, so a phishing contract passes the check. Use msg.sender to authenticate the direct caller." },
  { q: "What does `blockhash(block.number)` return inside a function?", options: ["The hash of the current block", "The hash of the previous block", "Zero, because the current block's hash is not known yet", "It reverts"], answer: 2, explain: "Only the 256 most recent blocks before the current one are available. Asking for the current block, or anything older than 256 blocks, yields zero." },
  { q: "Which member changes between external calls within one transaction?", options: ["`block.number`", "`msg.value`", "`tx.gasprice`", "`block.chainid`"], answer: 1, explain: "msg members describe the current call and can differ on every external call. block and tx members stay the same for the entire transaction." },
  { q: "A raffle picks a winner with `uint256 pick = uint256(blockhash(block.number - 1)) % entrants;`. Why is that a poor design?", options: ["`blockhash` is too slow for a contract to call on each draw", "`%` is not allowed on a hash value in any contract", "It would pick the same winner on every chain and fork", "The hash is public, so a caller can precompute the winner"], answer: 3, explain: "A value that anyone can read before sending the transaction gives no secrecy. A contract can even check the outcome and revert if it loses." },
  { q: "What is `block.difficulty` on a post-Merge chain?", options: ["The proof-of-work difficulty, as before", "Always zero", "A deprecated alias of `block.prevrandao`", "The gas limit divided by the base fee"], answer: 2, explain: "After the Paris upgrade the opcode returns the randomness value. Solidity keeps the old name as an alias but recommends block.prevrandao." },
  { q: "In a function that is not marked `payable`, what happens if someone sends it ether?", options: ["The ether is kept and `msg.value` shows it", "The call reverts", "The ether is returned after the function ends", "The ether is burned"], answer: 1, explain: "A non-payable function rejects calls that carry wei. Only payable functions can receive ether through a normal call." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "guestbook": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Guestbook {
    address public lastSigner;
    uint256 public lastPaid;
    uint256 public lastTime;

    function sign() external payable {
        // TODO: record who called, how much they sent, and the block time
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Guestbook {
    address public lastSigner;
    uint256 public lastPaid;
    uint256 public lastTime;

    function sign() external payable {
        lastSigner = msg.sender;
        lastPaid = msg.value;
        lastTime = block.timestamp;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "Guestbook", kind: "function", name: "sign", inputs: [], stateMutability: "payable", message: "sign() is payable" },
      { type: "regex", pattern: "\\blastSigner\\s*=\\s*msg\\.sender\\s*;", message: "lastSigner stores msg.sender" },
      { type: "regex", pattern: "\\blastPaid\\s*=\\s*msg\\.value\\s*;", message: "lastPaid stores msg.value" },
      { type: "regex", pattern: "\\blastTime\\s*=\\s*block\\.timestamp\\s*;", message: "lastTime stores block.timestamp" },
    ],
  },
};
