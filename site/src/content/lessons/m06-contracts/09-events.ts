import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "What does `indexed` do to an event parameter?", options: ["Stores it in storage so that the contract can read it again later on", "Puts it in a searchable topic instead of the data part of the log", "Makes the parameter optional, so it can be left out when the event is emitted", "Encrypts the value"], answer: 1, explain: "Indexed parameters become topics, which off-chain tools can filter on. The rest is ABI-encoded into the data part." },
  { q: "How many parameters of a normal (non-anonymous) event can be `indexed`?", options: ["Two, because the other topics are reserved", "Four, the same as an anonymous event", "Unlimited, as long as gas allows", "Three"], answer: 3, explain: "The signature hash takes the first of four topic slots, leaving three. Anonymous events skip the signature hash and can index four." },
  { q: "An event has `string indexed name`. What can an off-chain reader get from the topic?", options: ["The original string", "The keccak256 hash of the string, not the text itself", "Only the string's length, in bytes, padded to 32 bytes", "The first 32 bytes of the string, cut off at the end"], answer: 1, explain: "A topic is one 32-byte word. For reference types such as string, bytes and arrays the hash is stored, so the content cannot be recovered from it." },
  { q: "Spot the bug: `function total() external view returns (uint256) { emit Checked(msg.sender); return count; }`. What is wrong?", options: ["Nothing at all: events are free and always allowed", "Events cannot be emitted from external functions, only from internal ones", "Emitting writes a log, a state change that `view` forbids", "`msg.sender` cannot be used as an argument anywhere inside an event"], answer: 2, explain: "Emitting an event counts as modifying state, so it is not allowed in view or pure functions. The compiler rejects this." },
  { q: "A contract emits `Paid(student, 5)`. Later, another function of the same contract wants the value `5` back. What should it do?", options: ["Read the log back with a built-in `logs()` function of the language", "Call the event again as if it were a function that returns its arguments", "Use `Paid.selector` to look the stored value up again later on", "Also keep it in a state variable, as contracts cannot read any logs"], answer: 3, explain: "Logs are not accessible from inside contracts, not even the one that created them. Keep any data you need on-chain in storage." },
  { q: "What does `Paid.selector` give for `event Paid(address indexed who, uint256 amount);`?", options: ["The keccak256 hash of `Paid(address,uint256)`, as `bytes32`", "The first four bytes of the address of the emitting contract", "The position of the event among all events declared in the contract", "The number of indexed parameters"], answer: 0, explain: "For non-anonymous events it is the signature hash, which is the default first topic of every log entry the event produces." },
  { q: "Why would you declare an event `anonymous`?", options: ["It hides the sender of the transaction from everyone who reads the log", "It lets the event be emitted from `pure` and `view` functions", "It is cheaper and allows a fourth indexed parameter, but you can no longer filter by event name", "It makes the event readable by other contracts that know the contract address"], answer: 2, explain: "Anonymous events omit the signature topic. That saves gas and frees a topic, but searching by name is no longer possible." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "enrol-event": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Roster {
    uint256 public count;

    // TODO: declare event Enrolled(address student, uint256 course, uint256 year)
    // with all three parameters indexed

    function enrol(uint256 course, uint256 year) external {
        count += 1;
        // TODO: emit Enrolled for msg.sender, course and year
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Roster {
    uint256 public count;

    event Enrolled(address indexed student, uint256 indexed course, uint256 indexed year);

    function enrol(uint256 course, uint256 year) external {
        count += 1;
        emit Enrolled(msg.sender, course, year);
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "Roster", kind: "event", name: "Enrolled", inputs: ["address", "uint256", "uint256"], message: "Event Enrolled(address, uint256, uint256) exists" },
      { type: "regex", pattern: "event\\s+Enrolled\\s*\\([^)]*indexed[^)]*indexed[^)]*indexed[^)]*\\)", message: "All three parameters are indexed" },
      { type: "regex", pattern: "emit\\s+Enrolled\\s*\\(\\s*msg\\.sender\\s*,\\s*course\\s*,\\s*year\\s*\\)", message: "enrol emits Enrolled(msg.sender, course, year)" },
    ],
  },
};
