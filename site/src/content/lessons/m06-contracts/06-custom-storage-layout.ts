import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "What does `contract Lockers layout at 0x1000 { uint256 total; }` change?", options: ["`total` is stored in slot 0x1000 instead of slot 0", "`total` becomes a constant whose value is fixed at 0x1000 by the compiler", "`total` is stored in memory at address 0x1000", "The contract is deployed at address 0x1000"], answer: 0, explain: "The specifier moves the starting point of the contract's persistent state variables. The first variable lands in the chosen base slot." },
  { q: "Which base-slot expression is accepted?", options: ["`layout at msg.sender`", "`layout at block.number`", "`layout at slotFromConstructor`, a value that is set inside the constructor", "`layout at 2**16 + 0x20`"], answer: 3, explain: "The compiler must be able to evaluate the expression, so it has to be built from literals and constants. Runtime values like msg.sender or block.number cannot work." },
  { q: "Contract `Child is Parent`. Where can `layout at ...` be written?", options: ["On `Parent` only, since the base contract owns the variables", "On `Child`, the most derived contract, and it shifts the inherited variables too", "On both, and the compiler adds the two offsets", "Nowhere at all, because inheritance forbids any custom layout whatsoever"], answer: 1, explain: "Only the topmost contract in the tree specifies the layout. All variables in the tree, base ones included, shift by the same amount." },
  { q: "Spot the bug: `contract Cache layout at 5 { uint256 transient seen; uint256 total; }`. A developer expects `seen` to sit in transient slot 5. What really happens?", options: ["`seen` is shifted to transient slot 5 and `total` to slot 6", "The compiler rejects mixed transient and persistent variables", "`seen` is not affected, and only `total` is placed starting at slot 5", "Both variables are placed at slot 5 and they overwrite each other whenever either is written"], answer: 2, explain: "The layout specifier applies to persistent storage only. Transient variables stay in their own separate address space." },
  { q: "What is the main reason proxy-based systems use a custom storage layout or `erc7201`?", options: ["To make every storage read cheaper by moving the variables closer to the code", "To keep the proxy's variables and the logic contract's variables from overwriting each other", "To let the logic contract run without `delegatecall`", "To allow mappings to be returned from functions"], answer: 1, explain: "With delegatecall the logic's code works on the proxy's storage. If both sides start at slot 0 they clash; placing one at a distant base slot avoids that." },
  { q: "`contract Big layout at 2**256 - 2 { uint256[3] items; }` is compiled. What happens?", options: ["It compiles, and the array wraps around to slot 0", "It compiles with a warning only", "A compile error: the fixed-size variables would run past the end of storage", "It compiles without complaint, but every write to the array reverts at run time"], answer: 2, explain: "A custom layout may not make storage wrap around. Three consecutive slots starting two before the end do not fit." },
  { q: "What does `erc7201(\"ashesi.archive.v1\")` give you inside a `layout at` expression?", options: ["A collision-resistant base slot computed from the name", "The address of a deployed registry contract that stores the namespaces", "A random slot chosen at deployment time", "The hash of the contract's bytecode"], answer: 0, explain: "It is a compile-time function that turns a namespace string into a base slot following the ERC-7201 formula." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "custom-slot": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

// TODO: start this contract's storage at slot 0x100 using a layout specifier
contract Notebook {
    uint256 public pages;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function addPage() external {
        pages += 1;
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

contract Notebook layout at 0x100 {
    uint256 public pages;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function addPage() external {
        pages += 1;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "regex", pattern: "contract\\s+Notebook\\s+layout\\s+at\\s+", message: "Notebook uses a layout at specifier" },
      { type: "regex", pattern: "layout\\s+at\\s+(0x0*100|256)\\s*\\{", message: "The base slot is 0x100 (256)" },
    ],
  },
};
