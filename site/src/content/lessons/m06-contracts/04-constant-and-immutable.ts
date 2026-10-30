import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Which declaration is valid?", options: ["`uint256 constant OPENED = block.timestamp;`", "`uint256 constant WEEK = 7 days;`", "`address constant ME = msg.sender;`", "`uint256 constant BAL = address(this).balance;`"], answer: 1, explain: "A constant needs a value the compiler knows. Unit literals qualify; the timestamp, the sender and the balance only exist at run time." },
  { q: "When can an `immutable` variable be given its value?", options: ["At any time by the owner", "In any function, once", "During construction only", "Never; immutables must be initialised at compile time"], answer: 2, explain: "Immutables are assigned at declaration or inside the constructor. After that the value is baked into the runtime code." },
  { q: "Where does the value of an `immutable` live after deployment?", options: ["In the first free storage slot of the contract", "In memory, which is reloaded again for each call", "In the transaction's calldata, sent along by the caller", "Inside the deployed code"], answer: 3, explain: "The constructor patches the value into the runtime code wherever it is read, so no storage slot is used." },
  { q: "Spot the bug: `function setClose(uint256 d) external { closesAt = d; }` where `closesAt` is `uint256 public immutable closesAt;`. What happens?", options: ["It compiles, and the next call fails with a panic", "It compiles and changes the value only until the next block", "It does not compile: only the constructor may assign", "It compiles, but the assignment is silently ignored at run time"], answer: 2, explain: "Assignment to an immutable outside the constructor (or the declaration) is a compile-time error, because that code could run after creation." },
  { q: "Why is reading a `constant` cheaper than reading a normal state variable?", options: ["The value is inserted into the code, so no storage load is needed", "Constants are cached by the node between blocks", "The compiler stores constants in a special free storage area", "It is not cheaper; only the deployment cost changes"], answer: 0, explain: "A storage read costs 100 to 2,100 gas. A constant is copied into the places it is used, so the load disappears." },
  { q: "Which type can be declared `constant` but not `immutable`?", options: ["`address`", "`bool`", "`uint8`", "`string`"], answer: 3, explain: "Strings are supported for constants. Immutables work only with value types such as numbers, bools and addresses." },
  { q: "You deploy the same `Election` source twice with different `registrar_` arguments. How do the two runtime bytecodes compare?", options: ["Identical, because the source code is exactly the same", "They differ: each immutable is patched in with its own value", "The second deployment reverts, because immutables must be unique per chain", "Identical bytecode, though the storage contents differ between them"], answer: 1, explain: "The values are embedded in the code, so the bytes differ in the places where the immutables are read. This matters when verifying a deployment against compiler output." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "config-constants": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Fees {
    // TODO: these two are fixed in the source: make them constants
    uint256 public LATE_FEE = 5;
    uint256 public SEMESTER = 16 weeks;

    // TODO: these two are fixed when the contract is deployed: make them immutable
    address public TREASURER;
    uint256 public DEPLOYED_AT;

    constructor(address treasurer_) {
        TREASURER = treasurer_;
        DEPLOYED_AT = block.timestamp;
    }

    function dueBy() external view returns (uint256) {
        return DEPLOYED_AT + SEMESTER;
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Fees {
    uint256 public constant LATE_FEE = 5;
    uint256 public constant SEMESTER = 16 weeks;

    address public immutable TREASURER;
    uint256 public immutable DEPLOYED_AT;

    constructor(address treasurer_) {
        TREASURER = treasurer_;
        DEPLOYED_AT = block.timestamp;
    }

    function dueBy() external view returns (uint256) {
        return DEPLOYED_AT + SEMESTER;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "noWarnings" },
      { type: "regex", pattern: "\\bconstant\\s+LATE_FEE\\s*=\\s*5\\s*;", message: "LATE_FEE is a constant" },
      { type: "regex", pattern: "\\bconstant\\s+SEMESTER\\s*=", message: "SEMESTER is a constant" },
      { type: "regex", pattern: "\\bimmutable\\s+TREASURER\\s*;", message: "TREASURER is immutable" },
      { type: "regex", pattern: "\\bimmutable\\s+DEPLOYED_AT\\s*;", message: "DEPLOYED_AT is immutable" },
      { type: "abi", contract: "Fees", kind: "function", name: "dueBy", inputs: [], outputs: ["uint256"], stateMutability: "view", message: "dueBy() is still a view function" },
    ],
  },
};
