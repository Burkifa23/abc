import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "A student deploys `ChessClub is Club`. How many contracts exist on the chain afterwards?", options: ["Two: one for Club and one for ChessClub, linked by delegatecall", "One: the base code is compiled into the derived contract", "Three: Club, ChessClub and a hidden registry that joins them", "Zero until someone calls a function that uses the base"], answer: 1, explain: "Inheritance is resolved by the compiler. The bytecode of all bases is combined into the single deployed contract, so base calls are plain internal jumps." },
  { q: "Which keywords does a function need so that it replaces a base function and can itself be replaced further down?", options: ["`override` only, since overrides are always open to change", "`virtual` only, because that is what marks a function as replacement", "`virtual override`", "`public override`"], answer: 2, explain: "`override` says you are replacing the base version, and `virtual` keeps the door open for contracts below you. Without `virtual` the chain is sealed." },
  { q: "```solidity\ncontract Base { uint256 internal total; }\ncontract Child is Base { uint256 internal total; }\n```\nWhat happens when this is compiled?", options: ["It compiles, and Child's variable hides the one in Base", "It compiles and the two share one storage slot", "It compiles with a warning only", "It fails: shadowing an inherited state variable is an error"], answer: 3, explain: "A derived contract may not declare a state variable that has the same name as a visible one in its bases." },
  { q: "```solidity\ncontract Base { function f() external view virtual returns (uint256) { return 1; } }\ncontract Child is Base { function f() public pure override returns (uint256) { return 2; } }\n```\nDoes `Child` compile?", options: ["Yes: external may become public, and view may become pure", "No: the visibility may never change in an override", "No: pure functions cannot override view functions in any case", "Yes, but only if Child also repeats the word virtual"], answer: 0, explain: "Overrides may widen `external` to `public` and tighten the mutability from `view` to `pure`. Neither change breaks callers." },
  { q: "Spot the bug: `contract Robotics is Club(\"Robotics\", 25) { constructor() Club(\"Robotics\", 25) {} }`", options: ["`Club` cannot be given arguments inside the `is` list", "The constructor must be marked `payable` to forward the arguments", "The base constructor arguments are given twice, which is an error", "Nothing: giving the arguments twice is a harmless safety measure"], answer: 2, explain: "The base arguments may be supplied once, either in the `is` list or in the constructor header, not in both places." },
  { q: "In which order do constructors run for `contract Debate is Club` where `Club` has a constructor?", options: ["Club's constructor first, then Debate's constructor body", "Debate's body first, then Club's, since the child knows what it needs", "They run in parallel and the order cannot be relied on", "Only Debate's runs, because base constructors are skipped"], answer: 0, explain: "Constructors run from the most base-like contract down to the most derived one, following the linearized order." },
  { q: "Why can a `private` function not be `virtual`?", options: ["Because private functions cost too much gas to be replaced", "Because derived contracts cannot see private members, so there would be nothing for them to override", "Because only external functions are allowed to carry the virtual keyword", "Because the compiler removes unused private functions before deployment"], answer: 1, explain: "A private member is invisible outside its own contract, so a derived contract has no way to name it, let alone replace it." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "chess-club": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Club {
    string public name;
    uint256 internal dues;

    constructor(string memory name_, uint256 dues_) {
        name = name_;
        dues = dues_;
    }

    function fee() public view virtual returns (uint256) {
        return dues;
    }
}

// Hint: pass base arguments in the constructor header, like: constructor(uint256 x) Base("text", x) {}
// Hint: super.fee() calls the next implementation up the chain.
// TODO: remove "abstract", add a constructor taking dues_ that passes ("Chess", dues_) to Club,
// and override fee() so it returns the base fee plus EQUIPMENT.
abstract contract ChessClub is Club {
    uint256 public constant EQUIPMENT = 5;
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Club {
    string public name;
    uint256 internal dues;

    constructor(string memory name_, uint256 dues_) {
        name = name_;
        dues = dues_;
    }

    function fee() public view virtual returns (uint256) {
        return dues;
    }
}

contract ChessClub is Club {
    uint256 public constant EQUIPMENT = 5;

    constructor(uint256 dues_) Club("Chess", dues_) {}

    function fee() public view virtual override returns (uint256) {
        return super.fee() + EQUIPMENT;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "regex", pattern: "^\\s*contract\\s+ChessClub\\s+is\\s+Club", flags: "m", message: "ChessClub is a concrete contract (not abstract)" },
      { type: "regex", pattern: "constructor\\s*\\(\\s*uint256\\s+\\w+\\s*\\)\\s*Club\\s*\\(\\s*\"Chess\"\\s*,\\s*\\w+\\s*\\)", message: "The constructor passes (\"Chess\", dues) to Club in its header" },
      { type: "regex", pattern: "function\\s+fee\\s*\\(\\s*\\)[^{]*\\boverride\\b", message: "fee() is marked override" },
      { type: "regex", pattern: "super\\s*\\.\\s*fee\\s*\\(\\s*\\)\\s*\\+\\s*EQUIPMENT", message: "fee() returns super.fee() + EQUIPMENT" },
      { type: "abi", contract: "ChessClub", kind: "function", name: "fee", inputs: [], outputs: ["uint256"], stateMutability: "view", message: "ChessClub exposes view fee() returns (uint256)" },
    ],
  },
};
