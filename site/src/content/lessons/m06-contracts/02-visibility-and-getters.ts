import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "What visibility does a state variable get if you write only `uint256 total;`?", options: ["`public`", "`private`", "`external`", "`internal`"], answer: 3, explain: "State variables default to internal: usable in this contract and the ones inheriting from it. There is no external visibility for variables." },
  { q: "Given `uint256[] public marks;`, what does the generated getter do?", options: ["Returns the whole array in one call", "Takes an index and returns that one element", "Takes no arguments and returns the array length", "Is not generated, since arrays cannot be public"], answer: 1, explain: "Array getters take an index and return one element, which avoids huge return values. Write a separate function to return everything." },
  { q: "`struct Book { string title; uint16 year; address[] borrowers; }` is stored in `mapping(uint256 => Book) public books;`. What does `books(1)` return?", options: ["`(title, year, borrowers)`", "`(title, year)`", "Only `title`", "The whole struct as one tuple including mappings"], answer: 1, explain: "Struct getters return each member except arrays and mappings. The array `borrowers` is skipped; `string` and `uint16` are kept." },
  { q: "Spot the bug: the contract has `uint256 private secretCode = 4821;` and the author says nobody can learn the code. What is wrong?", options: ["`private` cannot be applied to a `uint256`", "The compiler will print the value in the build output", "Other contracts inherit it, so it stays visible on the chain", "Anyone can read the raw storage slot from a node, so it is not secret"], answer: 3, explain: "Visibility restricts other contracts' source code only. The data is stored on chain in the open." },
  { q: "Inside a contract, `uint256 public total;` and a function `viaGetter() external view returns (uint256) { return this.total(); }`. What does `this.total()` do?", options: ["Calls the generated getter through an external call to the contract's own address", "Reads the storage variable directly with no call", "Fails to compile, since getters cannot be called with this", "Writes `total` back to storage"], answer: 0, explain: "`total` alone is internal access to the variable. `this.total()` is an external call to the getter function." },
  { q: "A function `f` is declared `external`. How can another function in the same contract call it?", options: ["Simply as `f()`", "As `this.f()`, which makes it a real external call", "Only through `super.f()`", "It cannot be called from inside the contract at all"], answer: 1, explain: "External functions are not callable by plain name from inside the contract. The `this.` prefix converts the call to an external one." },
  { q: "Which of these functions can take a `mapping(address => uint256) storage` parameter?", options: ["`function f(mapping(address => uint256) storage m) external`", "`function f(mapping(address => uint256) storage m) public`", "`function f(mapping(address => uint256) storage m) internal`", "None of them, since mappings cannot be passed around"], answer: 2, explain: "Only functions outside the ABI (internal or private) may take parameters of internal types such as mappings and storage references." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "pick-visibility": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Gradebook {
    // TODO: students should be able to look up their mark: give this a getter
    mapping(address => uint256) marks;

    // TODO: keep the pass mark hidden from the ABI
    uint256 public passMark = 50;

    // TODO: only lecturers' scripts call this from outside: make it reachable.
    // It should store curve(m) instead of m.
    function record(address student, uint256 m) internal {
        marks[student] = m;
    }

    // TODO: a helper, not part of the interface
    function curve(uint256 m) public pure returns (uint256) {
        return m + 5;
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Gradebook {
    mapping(address => uint256) public marks;

    uint256 private passMark = 50;

    function record(address student, uint256 m) external {
        marks[student] = curve(m);
    }

    function curve(uint256 m) internal pure returns (uint256) {
        return m + 5;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "Gradebook", kind: "function", name: "marks", inputs: ["address"], outputs: ["uint256"], stateMutability: "view", message: "marks(address) getter exists" },
      { type: "abi", contract: "Gradebook", kind: "function", name: "record", inputs: ["address", "uint256"], stateMutability: "nonpayable", message: "record(address,uint256) is in the ABI" },
      { type: "abi", contract: "Gradebook", kind: "function", name: "curve", inputs: ["uint256"], absent: true, message: "curve is not in the ABI" },
      { type: "abi", contract: "Gradebook", kind: "function", name: "passMark", inputs: [], absent: true, message: "passMark has no getter" },
      { type: "regex", pattern: "marks\\s*\\[\\s*student\\s*\\]\\s*=\\s*curve\\s*\\(", message: "record stores curve(m) for the student" },
    ],
  },
};
