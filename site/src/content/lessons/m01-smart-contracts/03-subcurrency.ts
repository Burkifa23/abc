import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "What does `balanceOf[someone]` return for an address that has never been used?", options: ["It reverts", "`null`", "The treasurer's balance", "Zero"], answer: 3, explain: "A mapping behaves as if every key exists, with a value of all zero bytes. For uint256 that is 0." },
  { q: "In `constructor() { treasurer = msg.sender; }`, who is `msg.sender`?", options: ["The address that created the contract", "The address of the contract itself", "Whoever calls the contract next", "The zero address"], answer: 0, explain: "The constructor runs during creation, so msg.sender is the deployer." },
  { q: "What does `revert InsufficientBalance(amount, mine);` do?", options: ["Logs a warning, keeps the changes made so far and carries on", "Only works when the caller is the treasurer who deployed it", "Stops the call, undoes its changes and reports the error", "Sends the amount back to the treasurer and carries on"], answer: 2, explain: "A revert aborts the call and rolls back every change. The custom error with its arguments is returned so tools can explain why." },
  { q: "Spot the bug: `function mint(address to, uint256 amount) public { balanceOf[to] += amount; }` (no other lines). What is wrong?", options: ["`+=` is not valid on mappings", "The function should be `view`", "Anybody can create unlimited credits for themselves", "The amount must be signed"], answer: 2, explain: "Without a check on msg.sender, every caller can mint. The permission check is what makes the treasurer special." },
  { q: "Ama has 3 credits and calls `send(kofi, 5)` in the contract from this lesson. What happens?", options: ["Her balance becomes 0 and Kofi receives the 3 she has", "Her balance wraps around to a huge positive number", "Kofi still gets 5 credits and her balance goes negative", "Nothing is written; the error shows 5 asked and 3 held"], answer: 3, explain: "The explicit check fails first, so the call reverts with InsufficientBalance(5, 3). No balance changes." },
  { q: "Why is `emit Sent(msg.sender, to, amount);` in the contract at all?", options: ["Contracts need it in order to update balances", "It lets wallets and outside programs react cheaply", "It lets other contracts read the history of transfers", "It stops arithmetic overflow when balances are updated"], answer: 1, explain: "Events go into the log, which outside programs can watch efficiently. Contracts cannot read old logs, and balances are updated by the assignments." },
  { q: "You send credits to a friend and look at your friend's address in a block explorer, but you see nothing. Why?", options: ["Balances live in the coin contract, not in the friend's account", "The transaction failed and was silently rolled back by the network", "Explorers hide token transfers from the main page", "Events were disabled when the contract was first deployed"], answer: 0, explain: "A subcurrency is just numbers in the contract's own storage. Look at the contract address and its events." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "coin": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Coin {
    address public treasurer;
    mapping(address => uint256) public balanceOf;

    constructor() {
        treasurer = msg.sender;
    }

    // TODO: event Sent(address from, address to, uint256 amount)
    // TODO: error InsufficientBalance(uint256 requested, uint256 available)
    // TODO: mint(address,uint256): only the treasurer may call it
    // TODO: send(address,uint256): revert if the sender has too little, else move the amount and emit Sent
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Coin {
    address public treasurer;
    mapping(address => uint256) public balanceOf;

    event Sent(address from, address to, uint256 amount);
    error NotTreasurer();
    error InsufficientBalance(uint256 requested, uint256 available);

    constructor() {
        treasurer = msg.sender;
    }

    function mint(address to, uint256 amount) public {
        if (msg.sender != treasurer) revert NotTreasurer();
        balanceOf[to] += amount;
    }

    function send(address to, uint256 amount) public {
        uint256 mine = balanceOf[msg.sender];
        if (mine < amount) revert InsufficientBalance(amount, mine);
        balanceOf[to] += amount;
        balanceOf[msg.sender] -= amount;
        emit Sent(msg.sender, to, amount);
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "Coin", kind: "function", name: "mint", inputs: ["address", "uint256"], message: "Has mint(address,uint256)" },
      { type: "abi", contract: "Coin", kind: "function", name: "send", inputs: ["address", "uint256"], message: "Has send(address,uint256)" },
      { type: "abi", contract: "Coin", kind: "event", name: "Sent", inputs: ["address", "address", "uint256"], message: "Declares event Sent(address,address,uint256)" },
      { type: "abi", contract: "Coin", kind: "error", name: "InsufficientBalance", inputs: ["uint256", "uint256"], message: "Declares error InsufficientBalance(uint256,uint256)" },
      { type: "regex", pattern: "msg\\.sender\\s*!=\\s*treasurer|treasurer\\s*!=\\s*msg\\.sender|msg\\.sender\\s*==\\s*treasurer|treasurer\\s*==\\s*msg\\.sender", message: "mint compares msg.sender with the treasurer" },
      { type: "regex", pattern: "revert\\s+InsufficientBalance\\s*\\(", message: "send reverts with InsufficientBalance(...)" },
      { type: "regex", pattern: "emit\\s+Sent\\s*\\(", message: "send emits Sent(...)" },
      { type: "regex", pattern: "balanceOf\\[[^\\]]+\\]\\s*\\+=", message: "A balance is increased with +=" },
    ],
  },
};
