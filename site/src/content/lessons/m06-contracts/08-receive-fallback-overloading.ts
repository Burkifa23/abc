import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Someone sends ether to a contract with empty calldata. The contract has `receive() external payable` and `fallback() external payable`. Which runs?", options: ["`fallback`, because it is more general than receive and so is tried first", "Both, `receive` first", "Neither: plain transfers always revert", "`receive`, as empty calldata prefers it"], answer: 3, explain: "Empty calldata goes to receive when it exists. The fallback only handles plain transfers when there is no receive." },
  { q: "A contract has only `fallback() external` (not payable). A caller invokes `doesNotExist()` and attaches 1 wei. What happens?", options: ["The fallback runs and keeps the wei", "The call reverts, as no payable path exists", "The call succeeds and the single wei is returned to the sender afterwards", "The compiler rejects the call"], answer: 1, explain: "The fallback is picked for the unknown selector, but without `payable` it refuses ether, so the call reverts." },
  { q: "Which declaration of `receive` is valid?", options: ["`function receive() external payable {}`", "`receive(uint256 x) external payable {}`", "`receive() public view {}`", "`receive() external payable {}`"], answer: 3, explain: "receive is written without the function keyword, takes no arguments, and must be external and payable." },
  { q: "Spot the bug: `receive() external payable { log.push(msg.sender); }` where `log` is a storage array. A user pays with `.transfer`. What happens?", options: ["It works, because pushing is cheap", "It fails: `.transfer` only forwards 2300 gas, and a storage write costs more", "It fails to compile, because storage cannot be used in receive", "It works but the sender is recorded as the zero address"], answer: 1, explain: "The 2300-gas allowance of send and transfer is enough for a log, not a storage write. The call runs out of gas and reverts." },
  { q: "A contract has `f(uint8)` and `f(uint256)`. Which call fails to compile?", options: ["`f(256)`", "`f(uint8(7))` with an explicit cast", "`f(50)` with a bare literal", "`f(uint256(7))`"], answer: 2, explain: "50 converts implicitly to both uint8 and uint256, so two candidates remain and resolution fails. 256 does not fit uint8, so only one candidate exists." },
  { q: "Does the return type take part in overload resolution?", options: ["Yes, it is compared first", "Only for `view` functions, where it breaks ties between overloads", "Only for calls made from other contracts rather than from inside", "No: only parameters matter"], answer: 3, explain: "Two functions that differ only in their returns would be indistinguishable at the call site, so the compiler never looks at them." },
  { q: "Why can a contract's balance be higher than the sum recorded in its `receive`?", options: ["Ether can arrive without running any code, as a block reward or from a self-destructing contract", "Because `receive` is silently skipped whenever the sender provides little gas", "Because the fallback function always doubles every deposit it receives", "The compiler quietly adds a small service fee on top of the balance"], answer: 0, explain: "Block rewards and forced transfers from selfdestruct give a contract ether without calling any function, and the contract cannot refuse them." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "receive-fallback-overload": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Treasury {
    event Received(address indexed from, uint256 amount);
    error UnknownCall();

    // TODO: accept plain ether transfers and emit Received(msg.sender, msg.value)

    // TODO: revert with UnknownCall() for any call that matches no function

    // TODO: overload label: one version takes a uint256 id, one takes a string calldata name;
    // both are pure and return a string memory
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Treasury {
    event Received(address indexed from, uint256 amount);
    error UnknownCall();

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    fallback() external {
        revert UnknownCall();
    }

    function label(uint256 id) external pure returns (string memory) {
        return id == 0 ? "unknown" : "student";
    }

    function label(string calldata name) external pure returns (string memory) {
        return name;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "regex", pattern: "receive\\s*\\(\\s*\\)\\s*external\\s+payable", message: "A receive() external payable function exists" },
      { type: "regex", pattern: "emit\\s+Received\\s*\\(\\s*msg\\.sender\\s*,\\s*msg\\.value\\s*\\)", message: "receive emits Received(msg.sender, msg.value)" },
      { type: "regex", pattern: "fallback\\s*\\(\\s*\\)\\s*external", message: "A fallback() external function exists" },
      { type: "regex", pattern: "revert\\s+UnknownCall\\s*\\(", message: "The fallback reverts with UnknownCall()" },
      { type: "abi", contract: "Treasury", kind: "function", name: "label", inputs: ["uint256"], outputs: ["string"], stateMutability: "pure", message: "label(uint256) exists and is pure" },
      { type: "abi", contract: "Treasury", kind: "function", name: "label", inputs: ["string"], outputs: ["string"], stateMutability: "pure", message: "label(string) exists and is pure" },
    ],
  },
};
