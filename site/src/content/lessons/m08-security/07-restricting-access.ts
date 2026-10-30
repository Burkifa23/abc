import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "A contract stores `uint256 private secretScore;`. Which statement about access restriction is true?", options: ["Access rules stop people from reading the value, as long as it is `private`", "Only the contract's creator is able to read it from the chain", "Other contracts cannot name it, but anyone can read the raw storage slot", "Modifiers encrypt the value whenever a function that uses it runs"], answer: 2, explain: "Restrictions control who can change state or call functions. State itself is readable by everyone through storage queries, so secrets do not belong in it." },
  { q: "In a modifier, what does the statement `_;` do?", options: ["Marks the point where the modified function's body runs", "Ends the transaction successfully, skipping the function", "Repeats the modifier code once for every function argument", "Declares an unused variable so the compiler stays quiet"], answer: 0, explain: "Code before `_;` runs first, then the function body takes the place of `_;`, then any code after it runs." },
  { q: "Spot the bug: `modifier onlyBy(address a) { if (msg.sender == a) { _; } }` is used on `handOver(address next)`.", options: ["Callers other than `a` are silently skipped, and their call succeeds without doing anything", "`_;` may not appear inside an `if` block, so the contract will not compile", "Every caller, including `a`, is refused with a revert", "The modifier lets only `a` call and reverts everyone else, which is the intended rule"], answer: 0, explain: "Without a `revert` on the failing path, an unauthorised call just skips the body and returns normally, so the caller (and any front end) believes it worked. Reject with a revert instead." },
  { q: "`function publish(bytes32 h) external onlyBy(registrar) onlyAfter(embargoEnds)` is called by the registrar before the embargo ends. What happens?", options: ["`onlyBy` rejects the call, since the embargo has not ended yet", "The body runs, then `onlyAfter` reverts and undoes its changes", "`onlyAfter` reverts with `TooEarly` and the whole transaction is undone", "The call succeeds, because the first modifier already passed"], answer: 2, explain: "Both modifiers must pass. The first passes for the registrar, the second reverts, and the revert cancels the entire call." },
  { q: "Why pass `registrar` into `onlyBy(registrar)` rather than comparing with a fixed address in the code?", options: ["Passing an argument uses less gas than reading a variable would", "The rule follows the variable when `registrar` is changed later", "Modifiers are not allowed to read state variables directly", "Fixed addresses cannot be compared with `msg.sender` in 0.8"], answer: 1, explain: "The argument is evaluated at call time, so after a hand-over the new registrar is the one who passes. The same modifier also works for any other account." },
  { q: "What is a risk of a single-step `handOver(address newRegistrar)` function?", options: ["A mistyped address gives control to an account no one can use", "Calling it twice in a row always reverts the second call", "It clears every other modifier in the contract that uses `registrar`", "It lets the old registrar keep using `onlyBy` indefinitely"], answer: 0, explain: "If the new address is wrong, the role is lost for good. A two-step transfer that the new holder must accept, or a multisig, avoids this." },
];

const head = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ExamResults {
    address public registrar;
    uint256 public immutable embargoEnds;
    bool public published;
    bytes32 public resultsHash;

    error NotAuthorised(address caller);
    error TooEarly(uint256 currentTime, uint256 allowedFrom);

    constructor(uint256 embargoSeconds) {
        registrar = msg.sender;
        embargoEnds = block.timestamp + embargoSeconds;
    }

`;

const tail = `
    function publish(bytes32 hashOfResults)
        external
        onlyBy(registrar)
        onlyAfter(embargoEnds)
    {
        published = true;
        resultsHash = hashOfResults;
    }
}
`;

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  gates: {
    starter: `${head}    // TODO: revert NotAuthorised(msg.sender) unless msg.sender == account
    modifier onlyBy(address account) {
        _;
    }

    // TODO: revert TooEarly(block.timestamp, time) while block.timestamp < time
    modifier onlyAfter(uint256 time) {
        _;
    }
${tail}`,
    solution: `${head}    modifier onlyBy(address account) {
        if (msg.sender != account) revert NotAuthorised(msg.sender);
        _;
    }

    modifier onlyAfter(uint256 time) {
        if (block.timestamp < time) revert TooEarly(block.timestamp, time);
        _;
    }
${tail}`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "ExamResults", kind: "function", name: "publish", inputs: ["bytes32"], outputs: [], stateMutability: "nonpayable", message: "Has publish(bytes32)" },
      { type: "regex", pattern: "msg\\.sender\\s*!=\\s*account|account\\s*!=\\s*msg\\.sender", message: "onlyBy compares msg.sender with account" },
      { type: "regex", pattern: "revert\\s+NotAuthorised\\s*\\(", message: "onlyBy reverts with NotAuthorised" },
      { type: "regex", pattern: "block\\.timestamp\\s*<\\s*time|time\\s*>\\s*block\\.timestamp", message: "onlyAfter compares block.timestamp with time" },
      { type: "regex", pattern: "revert\\s+TooEarly\\s*\\(", message: "onlyAfter reverts with TooEarly" },
    ],
  },
};
