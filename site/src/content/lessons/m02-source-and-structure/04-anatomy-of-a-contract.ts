import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Which list names all the member kinds a contract can declare?", options: ["Variables and functions only", "State variables, functions, modifiers, events, errors, structs and enums", "Classes, interfaces and packages", "Functions, tables and queries"], answer: 1, explain: "These seven are the building blocks in the overview. Contracts can also inherit, and libraries and interfaces are special kinds of contract." },
  { q: "Where does the value of an ordinary state variable such as `uint256 total;` live?", options: ["In memory, wiped after each call", "In the caller's wallet", "In the transaction receipt", "In the contract's permanent storage"], answer: 3, explain: "A normal state variable is written to storage and survives between transactions. Only a variable marked `transient` is wiped when the transaction ends." },
  { q: "Spot the bug: a developer writes two modifiers, `modifier gate(uint256 a)` and `modifier gate(address b)`, hoping to overload them. What happens?", options: ["The compiler picks one by argument type", "Both work, since modifiers are like functions", "The compiler rejects it, because modifiers cannot be overloaded", "Only the first is used and the second is silently ignored"], answer: 2, explain: "Unlike functions, modifiers cannot share a name with different parameters. A derived contract can override a modifier, but overloading is not allowed." },
  { q: "Look at `error NotChair(address caller); ... if (msg.sender != chair) revert NotChair(msg.sender);`. What is the advantage over `require(msg.sender == chair, \"Not the chair\")`?", options: ["It is cheaper and can carry data such as the caller", "It lets the caller keep the gas", "It cannot be caught by other contracts", "It works without a revert"], answer: 0, explain: "A custom error has a short selector instead of a string, so it costs less and can include typed values. It still reverts like any other failure." },
  { q: "What is the right place to define a helper such as `function double(uint256 x) pure returns (uint256)` that no contract needs to own?", options: ["Nowhere: functions must be inside a contract", "Only in a library", "Inside an interface", "At file level, outside any contract"], answer: 3, explain: "Functions may be defined outside contracts. Such free functions are internal by nature and can be used by any contract that sees them." },
  { q: "What does `emit Joined(who, name);` do?", options: ["Sends the values to the next block producer", "Stores the values in a public state variable", "Writes a log entry that off-chain tools can read", "Calls the function named Joined"], answer: 2, explain: "An event is an interface to the EVM's logging facility. Contracts themselves cannot read old logs, but apps and explorers can." },
  { q: "Given `enum Phase { Open, Closed }`, which statement is true?", options: ["`Phase` is a contract", "`Phase` is a type with a finite set of named constant values", "`Phase` is a storage slot", "`Phase.Open` is a string"], answer: 1, explain: "An enum is a user-defined type with a fixed list of named values, handy for status flags." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "club-register": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ClubRegister {
    // TODO: enum Status { Pending, Active, Suspended }
    // TODO: struct Member { string name; Status status; }
    // TODO: address public chair, set to the deployer in a constructor
    // TODO: uint256 public memberCount
    // TODO: mapping(address => Member) members
    // TODO: error NotChair();
    // TODO: event Joined(address indexed who, string name);
    // TODO: modifier onlyChair that reverts with NotChair() unless msg.sender is chair
    // TODO: function join(address who, string calldata name) external onlyChair
    //       stores Member(name, Status.Active), increases memberCount, emits Joined
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ClubRegister {
    enum Status { Pending, Active, Suspended }

    struct Member {
        string name;
        Status status;
    }

    address public chair;
    uint256 public memberCount;
    mapping(address => Member) members;

    error NotChair();

    event Joined(address indexed who, string name);

    modifier onlyChair() {
        if (msg.sender != chair) revert NotChair();
        _;
    }

    constructor() {
        chair = msg.sender;
    }

    function join(address who, string calldata name) external onlyChair {
        members[who] = Member(name, Status.Active);
        memberCount++;
        emit Joined(who, name);
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "regex", pattern: "enum\\s+Status\\s*\\{", message: "Declares enum Status" },
      { type: "regex", pattern: "struct\\s+Member\\s*\\{", message: "Declares struct Member" },
      { type: "regex", pattern: "modifier\\s+onlyChair\\b", message: "Declares modifier onlyChair" },
      { type: "regex", pattern: "revert\\s+NotChair\\s*\\(", message: "The modifier reverts with NotChair()" },
      { type: "regex", pattern: "chair\\s*=\\s*msg\\.sender\\s*;", message: "The deployer becomes chair" },
      { type: "regex", pattern: "emit\\s+Joined\\s*\\(", message: "join emits Joined" },
      { type: "regex", pattern: "memberCount\\s*(\\+\\+|\\+=)", message: "join increases memberCount" },
      { type: "regex", pattern: "function\\s+join\\s*\\([^)]*\\)[^{]*\\bonlyChair\\b", message: "join is guarded by onlyChair" },
      { type: "regex", pattern: "members\\s*\\[\\s*who\\s*\\]\\s*=", message: "join stores the member in members[who]" },
      { type: "abi", contract: "ClubRegister", kind: "error", name: "NotChair", inputs: [], message: "Has error NotChair()" },
      { type: "abi", contract: "ClubRegister", kind: "event", name: "Joined", inputs: ["address", "string"], message: "Has event Joined(address,string)" },
      { type: "abi", contract: "ClubRegister", kind: "function", name: "join", inputs: ["address", "string"], stateMutability: "nonpayable", message: "Has join(address,string)" },
      { type: "abi", contract: "ClubRegister", kind: "function", name: "memberCount", inputs: [], outputs: ["uint256"], stateMutability: "view", message: "Has public memberCount" },
    ],
  },
};
