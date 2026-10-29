import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Which line raises a custom error `Closed(uint256 until)`?", options: ["`revert Closed(5);`", "`throw Closed(5);`", "`emit Closed(5);`", "`return Closed(5);`"], answer: 0, explain: "Errors are raised with `revert`, or as the second argument of `require`. They are not emitted or returned." },
  { q: "What exactly does a caller receive when `revert Underpaid(10, 500)` is executed?", options: ["The text `Underpaid`, plus the numbers written out as a string", "A 4-byte selector followed by the ABI-encoded arguments", "Only the two numbers", "A single 32-byte word that counts how many calls have failed so far"], answer: 1, explain: "Error data is encoded like a function call: the first four bytes of keccak256(\"Underpaid(uint256,uint256)\"), then the arguments." },
  { q: "Why are custom errors usually cheaper than `require(cond, \"long message\")`?", options: ["They are not stored on the chain at all, so they use no space anywhere", "The EVM skips all gas charges for any call that ends in a revert", "No string needs to be stored in the code or returned, only four bytes plus arguments", "They are only checked at compile time and vanish from the deployed code"], answer: 2, explain: "A string reason must live in the contract's bytecode and be copied out. An error with no parameters returns only the 4-byte selector." },
  { q: "Spot the bug: `error Low(uint256 a); error Low(uint256 a, uint256 b);` in the same contract.", options: ["It compiles: errors can be overloaded like functions", "It does not compile: errors cannot be overloaded", "It compiles, but only the first declaration can ever be used", "It compiles only when both of them are placed inside a library"], answer: 1, explain: "Unlike functions, errors cannot be overloaded or overridden. Give them different names." },
  { q: "`require(balance >= price, TooPoor(balance, price));` compiles on which setup?", options: ["Any Solidity 0.8.x release at all, whichever compiler pipeline is in use", "Only Solidity 0.4.x releases, written before custom errors existed", "Solidity 0.8.26 or later with via-IR (0.8.27 on the legacy pipeline)", "Only when the optimizer is switched off for the whole build"], answer: 2, explain: "Passing a custom error to require arrived in 0.8.26 for the via-IR pipeline and in 0.8.27 for the legacy one." },
  { q: "Contract A calls contract B, and B reverts with `error NotAllowed()`. A's code then reads that error and decides a user is unauthorised. What is the risk?", options: ["There is no risk: errors are cryptographically signed by the contract that raised them", "B can only revert with errors it declared itself, so the check is perfectly safe", "The error is deleted by the EVM before the data can ever reach contract A", "B, or something B calls, can forge revert data that looks like any error, so it should not drive security decisions"], answer: 3, explain: "Revert data is propagated up through nested calls unchanged, so an inner call can produce data that mimics an error your contract would raise." },
  { q: "Where can the same error name `Locked()` be declared?", options: ["Only once in the whole project, since names must be globally unique", "In two different contracts, and the ABI cannot tell them apart", "Only at file level", "Only inside libraries, where error names are scoped"], answer: 1, explain: "The same error can exist in distinct scopes. Callers only see the name and parameter types, not where it was defined." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "balance-error": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Canteen {
    mapping(address => uint256) public credit;

    // TODO: declare error LowCredit(uint256 have, uint256 need)

    function topUp() external payable {
        credit[msg.sender] += msg.value;
    }

    function buy(uint256 price) external {
        // TODO: if the sender's credit is below price, revert with
        // LowCredit(their credit, price)
        credit[msg.sender] -= price;
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Canteen {
    mapping(address => uint256) public credit;

    error LowCredit(uint256 have, uint256 need);

    function topUp() external payable {
        credit[msg.sender] += msg.value;
    }

    function buy(uint256 price) external {
        if (credit[msg.sender] < price) revert LowCredit(credit[msg.sender], price);
        credit[msg.sender] -= price;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "Canteen", kind: "error", name: "LowCredit", inputs: ["uint256", "uint256"], message: "Error LowCredit(uint256, uint256) exists" },
      { type: "regex", pattern: "revert\\s+LowCredit\\s*\\(\\s*credit\\s*\\[\\s*msg\\.sender\\s*\\]\\s*,\\s*price\\s*\\)", message: "buy reverts with LowCredit(credit[msg.sender], price)" },
      { type: "regex", pattern: "credit\\s*\\[\\s*msg\\.sender\\s*\\]\\s*<\\s*price", message: "The check compares credit with price" },
    ],
  },
};
