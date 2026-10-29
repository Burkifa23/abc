import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "What does the compiler do with the text in `// SPDX-License-Identifier: MIT`?", options: ["Checks it against the official SPDX list and rejects unknown names", "Ignores it completely", "Copies it into the output metadata without validating it", "Enforces the licence terms at deployment"], answer: 2, explain: "The compiler does not verify the name against the SPDX list. It only includes the string in the bytecode metadata. Legal enforcement is up to people, not the compiler." },
  { q: "Your team keeps its code private. Which value says so?", options: ["`UNLICENSE`", "`PRIVATE`", "Leave the line out, which produces no warning", "`UNLICENSED`"], answer: 3, explain: "`UNLICENSED` means no usage is allowed. `UNLICENSE` is a different, public-domain style licence that gives everything to everyone, and leaving the line out triggers a compiler warning." },
  { q: "What range does `pragma solidity ^0.8.24;` accept?", options: ["Exactly 0.8.24", "0.8.24 and above, including 0.9.x", "0.8.24 up to but not including 0.9.0", "Anything from 0.8.0 to 0.8.24"], answer: 2, explain: "The caret allows later versions that the maintainers promise stay compatible. For a 0.x release that means the same 0.8 line, so 0.9.0 is out." },
  { q: "Spot the bug: Kwame has compiler 0.8.38 installed and writes `pragma solidity ^0.8.40;`, hoping this makes the compiler become 0.8.40. What actually happens?", options: ["The compiler downloads 0.8.40 automatically and then continues", "Compilation fails: the pragma only checks the version", "The pragma is ignored because a version 0.8.40 does not exist yet", "The contract compiles but prints a version warning"], answer: 1, explain: "A version pragma never selects or switches a compiler. It is a gate: if the running version does not match, compilation stops with an error." },
  { q: "`Token.sol` declares `pragma abicoder v1;` and imports `Util.sol`, which has no abicoder pragma. Which statement is true?", options: ["`Util.sol` is forced to use v1 as well, since the importer chose it", "The compile fails because the two files disagree on the coder version", "v1 and v2 are merged into one coder for the whole build", "Pragmas apply only to their own file, so `Util.sol` keeps v2"], answer: 3, explain: "A pragma is local to its file and does not spread through imports. Every file must carry its own pragmas." },
  { q: "A file contains `pragma solidity >=0.8.20 <0.9.0;` followed by `pragma experimental SMTChecker;`. What is wrong with the second pragma?", options: ["It is deprecated; choose the engine through compiler settings", "It must come before the version pragma in the file", "It is only allowed inside contract bodies, not at file level", "Nothing; it is still the recommended way to turn on the formal checks"], answer: 0, explain: "The experimental SMTChecker pragma is deprecated and scheduled for removal. You enable the checker by choosing an engine when you run the compiler." },
  { q: "Since which release is ABI coder v2 the default?", options: ["0.8.0", "0.6.0", "0.4.0", "0.8.24"], answer: 0, explain: "It left experimental status in 0.6.0 but only became the default in 0.8.0. Coder v1 is deprecated." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "license-and-pragma": {
    starter: `contract Notice {
    uint256 public room;

    function set(uint256 newRoom) public {
        room = newRoom;
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Notice {
    uint256 public room;

    function set(uint256 newRoom) public {
        room = newRoom;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "noWarnings" },
      { type: "regex", pattern: "pragma\\s+solidity\\s+[\\^>=<~]*\\s*0\\.8", message: "Has a version pragma for the 0.8 line" },
      { type: "abi", contract: "Notice", kind: "function", name: "set", inputs: ["uint256"], stateMutability: "nonpayable", message: "Still has set(uint256)" },
      { type: "regex", pattern: "\\broom\\s*=\\s*newRoom\\s*;", message: "set still stores the argument in room" },
    ],
  },
};
