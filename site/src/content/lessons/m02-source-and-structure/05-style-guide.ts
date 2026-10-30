import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Which order does the style guide give for the elements of a source file?", options: ["Contracts, libraries, interfaces, errors, events, imports, pragmas", "Imports, pragmas, events, errors, libraries, interfaces, contracts", "Pragmas, imports, events, errors, interfaces, libraries, contracts", "Pragmas, contracts, imports, errors, events, libraries, interfaces"], answer: 2, explain: "File level order: pragmas, imports, events, errors, interfaces, libraries, contracts." },
  { q: "Inside a contract, which sequence is recommended?", options: ["Types, state variables, events, errors, modifiers, functions", "State variables, functions, modifiers, events, errors, types", "Functions, state variables, types, events, errors, modifiers", "Events, errors, types, modifiers, state variables, functions"], answer: 0, explain: "Types first, then state variables, events, errors, modifiers and finally functions." },
  { q: "Spot the bug in style: `function total() public view onlyChair returns (uint256)` was written as `function total() onlyChair public view returns (uint256)`. What does the guide say about this ordering?", options: ["It is fine, since the compiler accepts modifiers in any order", "Custom modifiers belong last, after visibility, mutability, virtual and override", "Custom modifiers should come first so the reader sees the restriction", "`view` must always come before visibility, with any modifiers after it"], answer: 1, explain: "The recommended modifier order is visibility, mutability, virtual, override, and only then custom modifiers." },
  { q: "Which declaration follows the naming conventions?", options: ["`uint256 public MaxVotes;`", "`uint256 public constant maxVotes = 5;`", "`uint256 public constant MAX_VOTES = 5;`", "`uint256 public constant Max_Votes = 5;`"], answer: 2, explain: "Constants use UPPER_CASE_WITH_UNDERSCORES. Ordinary variables use mixedCase." },
  { q: "A library function works on a struct `Roll`. How does the guide say to name the first parameter?", options: ["`self`", "`roll`", "`this`", "`r`"], answer: 0, explain: "When a library function operates on a custom struct, that struct should come first and be named `self`." },
  { q: "You see `function _closeBooking(uint256 id) internal`. What does the leading underscore tell a reader?", options: ["The function is not part of the contract's external API", "The function is deprecated and will be removed", "The function is payable and can receive ether", "The function is a library function called by delegatecall"], answer: 0, explain: "A leading underscore marks non-external functions and state variables. If you ever make one external, renaming it forces you to review every call site." },
  { q: "Which line of code follows the guide's whitespace rules?", options: ["`mapping (address => uint256) balances;`", "`mapping(address => uint256) balances;`", "`mapping( address => uint256 ) balances;`", "`mapping(address=>uint256) balances ;`"], answer: 1, explain: "Do not put a space between `mapping` and its opening parenthesis, and avoid extra spaces inside the brackets." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "reorder-lab-booking": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract LabBooking {
    function _record() private {
        bookings += 1;
    }

    function count() external view returns (uint256) {
        return bookings;
    }

    function book(Slot slot) external whenOpen {
        if (bookings >= MAX_BOOKINGS) revert LabFull();
        _record();
        emit Booked(msg.sender, slot);
    }

    constructor() {
        admin = msg.sender;
    }

    modifier whenOpen() {
        if (!open) revert LabClosed();
        _;
    }

    error LabFull();
    error LabClosed();

    event Booked(address indexed who, Slot slot);

    uint256 public bookings;
    bool public open = true;
    address public admin;
    uint256 public constant MAX_BOOKINGS = 3;

    enum Slot { Morning, Afternoon }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract LabBooking {
    enum Slot { Morning, Afternoon }

    uint256 public constant MAX_BOOKINGS = 3;
    uint256 public bookings;
    bool public open = true;
    address public admin;

    event Booked(address indexed who, Slot slot);

    error LabClosed();
    error LabFull();

    modifier whenOpen() {
        if (!open) revert LabClosed();
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function book(Slot slot) external whenOpen {
        if (bookings >= MAX_BOOKINGS) revert LabFull();
        _record();
        emit Booked(msg.sender, slot);
    }

    function count() external view returns (uint256) {
        return bookings;
    }

    function _record() private {
        bookings += 1;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "noWarnings" },
      { type: "abi", contract: "LabBooking", kind: "function", name: "book", inputs: ["uint8"], stateMutability: "nonpayable", message: "Still has book(Slot)" },
      { type: "abi", contract: "LabBooking", kind: "function", name: "count", inputs: [], outputs: ["uint256"], stateMutability: "view", message: "Still has view count()" },
      { type: "regex", flags: "s", pattern: "enum\\s+Slot\\b.*?\\baddress\\s+public\\s+admin\\b", message: "Type declarations come before state variables" },
      { type: "regex", flags: "s", pattern: "address\\s+public\\s+admin\\b.*?\\bevent\\s+Booked\\b", message: "State variables come before events" },
      { type: "regex", flags: "s", pattern: "\\bevent\\s+Booked\\b.*?\\berror\\s+LabClosed\\b", message: "Events come before errors" },
      { type: "regex", flags: "s", pattern: "enum\\s+Slot\\b.*?\\bconstant\\s+MAX_BOOKINGS\\b", message: "Type declarations come before every state variable" },
      { type: "regex", flags: "s", pattern: "\\bbool\\s+public\\s+open\\b.*?\\bevent\\s+Booked\\b", message: "All state variables come before events" },
      { type: "regex", flags: "s", pattern: "\\bevent\\s+Booked\\b.*?\\berror\\s+LabFull\\b", message: "Events come before every error" },
      { type: "regex", flags: "s", pattern: "\\berror\\s+LabFull\\b.*?\\bmodifier\\s+whenOpen\\b", message: "Errors come before modifiers" },
      { type: "regex", flags: "s", pattern: "\\bmodifier\\s+whenOpen\\b.*?\\bconstructor\\s*\\(", message: "Modifiers come before the constructor" },
      { type: "regex", flags: "s", pattern: "\\bconstructor\\s*\\(.*?\\bfunction\\s+book\\b", message: "The constructor comes before the other functions" },
      { type: "regex", flags: "s", pattern: "\\bfunction\\s+book\\b.*?\\bfunction\\s+count\\b", message: "External functions that change state come before external view functions" },
      { type: "regex", flags: "s", pattern: "\\bfunction\\s+count\\b.*?\\bfunction\\s+_record\\b", message: "External functions come before private ones" },
    ],
  },
};
