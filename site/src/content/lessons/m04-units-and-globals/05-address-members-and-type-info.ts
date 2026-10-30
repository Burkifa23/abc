import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "What does `type(uint8).max` evaluate to?", options: ["8", "127", "255", "256"], answer: 2, explain: "An unsigned 8-bit integer holds 0 to 2^8 - 1, so the largest value is 255. Using type(T).max avoids typing the constant by hand." },
  { q: "Spot the bug: `function pay(address payable to, uint256 amount) external { to.call{value: amount}(\"\"); }`", options: ["The returned `bool` is ignored, so failure goes unnoticed", "`call` cannot send ether to an `address payable`", "`to` must be declared as `address`, not as `address payable`", "The empty string argument must be written as `0x`"], answer: 0, explain: "A low-level call reports failure with false instead of reverting. Capture the bool and revert (or handle it) when it is false." },
  { q: "Why is `transfer` discouraged in new code?", options: ["It sends the wrong currency when the receiver is a contract", "It only works inside constructors and receive functions", "It forwards unlimited gas, which invites reentrancy", "It forwards just 2,300 gas, which may be too little"], answer: 3, explain: "The fixed stipend breaks receivers that need slightly more gas, and repricings can break contracts that used to work. Use call with a result check." },
  { q: "A contract calls `selfdestruct(payable(owner))` in a later transaction, long after deployment, on a post-Cancun chain. What is the result?", options: ["The code and storage are erased, along with the balance", "The call reverts because the contract cannot be removed", "The balance is sent, but code and storage remain", "Nothing happens at all, not even the transfer"], answer: 2, explain: "Under EIP-6780 the ether is still moved, but the contract is removed only if selfdestruct runs in the same transaction that created it." },
  { q: "What is `type(IExam).interfaceId` made from?", options: ["The XOR of the selectors of its declared functions", "The interface's name hashed with keccak256 to four bytes", "The address where the interface was deployed", "The selector of the first function declared only"], answer: 0, explain: "The EIP-165 identifier XORs every selector declared in the interface (inherited functions excluded). It lets callers check for support." },
  { q: "Which visibility lets a function be called from other contracts but, without `this.`, not from inside its own contract?", options: ["`public`", "`internal`", "`private`", "`external`"], answer: 3, explain: "external functions are part of the contract's outside interface. Inside the contract you would need this.f(), which is an actual external call." },
  { q: "Which line fails to compile because of a reserved keyword?", options: ["`uint256 total = 1;`", "`uint256 final = 1;`", "`uint256 finale = 1;`", "`uint256 _final = 1;`"], answer: 1, explain: "`final` is reserved for future use. The other names are different identifiers." },
  { q: "What does `transient` on a state variable mean?", options: ["It is stored forever, but in a cheaper storage slot", "It lasts only for the current transaction, then resets", "It can be changed only by the constructor at deployment time", "It is hidden from other contracts that call this one"], answer: 1, explain: "Transient storage (EIP-1153) is cleared at the end of every transaction, which is ideal for temporary flags like a reentrancy lock." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "treasury": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IGrade {
    function record(uint256 student, uint8 mark) external;
}

contract Treasury {
    error NotOwner();
    error TransferFailed();

    address public immutable owner = msg.sender;

    receive() external payable {}

    function maxMark() external pure returns (uint8) {
        // TODO: the largest value a uint8 can hold, from the type itself
    }

    function gradeId() external pure returns (bytes4) {
        // TODO: the EIP-165 interface identifier of IGrade
    }

    function payOut(address payable to, uint256 amount) external {
        if (msg.sender != owner) revert NotOwner();
        // TODO: send amount wei to \`to\` with a low-level call; revert TransferFailed if it fails
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IGrade {
    function record(uint256 student, uint8 mark) external;
}

contract Treasury {
    error NotOwner();
    error TransferFailed();

    address public immutable owner = msg.sender;

    receive() external payable {}

    function maxMark() external pure returns (uint8) {
        return type(uint8).max;
    }

    function gradeId() external pure returns (bytes4) {
        return type(IGrade).interfaceId;
    }

    function payOut(address payable to, uint256 amount) external {
        if (msg.sender != owner) revert NotOwner();
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "noWarnings" },
      { type: "abi", contract: "Treasury", kind: "function", name: "payOut", inputs: ["address", "uint256"], stateMutability: "nonpayable", message: "payOut(address,uint256) changes state" },
      { type: "regex", pattern: "type\\s*\\(\\s*uint8\\s*\\)\\s*\\.max", message: "maxMark uses type(uint8).max" },
      { type: "regex", pattern: "type\\s*\\(\\s*IGrade\\s*\\)\\s*\\.interfaceId", message: "gradeId uses type(IGrade).interfaceId" },
      { type: "regex", pattern: "\\.call\\s*\\{\\s*value\\s*:\\s*amount\\s*\\}\\s*\\(", message: "payOut sends amount with .call{value: amount}(...)" },
      { type: "regex", pattern: "if\\s*\\(\\s*!\\s*\\w+\\s*\\)\\s*revert\\s+TransferFailed\\s*\\(|require\\s*\\(\\s*\\w+\\s*,\\s*TransferFailed\\s*\\(", message: "The call result is checked and TransferFailed is raised" },
    ],
  },
};
