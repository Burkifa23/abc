import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "A user calls `deposit(0)` and your function has `assert(amount > 0);`. What is wrong with that line?", options: ["Nothing; assert is the standard way to validate arguments in Solidity", "`assert` cannot compare numbers, only booleans stored in variables", "It's the caller's fault, so validate with `require` or `revert`", "`assert` always burns all remaining gas of the transaction"], answer: 2, explain: "`assert` is for invariants that only a bug can break. A failure raises Panic(0x01), signalling a defect in the contract rather than bad input." },
  { q: "Which statement raises a custom error `Closed()` correctly?", options: ["`revert Closed();`", "`revert(Closed);`", "`throw Closed();`", "`assert(Closed());`"], answer: 0, explain: "A custom error is raised with the `revert` statement, written without parentheses around the error. `throw` was removed in 0.5.0 and `assert` takes no error." },
  { q: "What does `require(cond)` with no second argument return as error data?", options: ["An `Error(string)` with the text \"false\"", "A Panic with code 0x01", "The selector of `require` only", "Nothing: the revert data is empty"], answer: 3, explain: "The one-argument form reverts with zero bytes, not even a selector. Add a string or a custom error if the caller should learn why." },
  { q: "Spot the bug: `require(ok, Denied(logAttempt()));` where `logAttempt()` writes a log entry to storage. What is the problem?", options: ["Custom errors cannot take the results of function calls as their arguments at all","The arguments run even when `ok` is true, so the write always happens","`require` cannot be used with custom errors on any compiler version","`logAttempt` must be declared `external` to be used inside an error"], answer: 1, explain: "`require` is an ordinary function, so its arguments run before the check. Use `if (!ok) revert Denied(logAttempt());` when building the error has side effects." },
  { q: "An array `uint256[] items` is empty and a function calls `items.pop()`. What happens?", options: ["`Error(\"empty\")` is raised", "A Panic with code 0x31", "It returns 0", "A Panic with code 0x11"], answer: 1, explain: "Popping an empty array is a compiler-inserted panic, code 0x31. Out-of-bounds indexing is 0x32 and arithmetic overflow is 0x11." },
  { q: "A contract does `(bool ok, ) = target.call(data);` and ignores `ok`. The target reverts. What does the caller see?", options: ["The caller reverts too, with the same error data bubbling up to it", "The call returns false instead of reverting, so execution goes on", "A Panic with code 0x00 is raised by a compiler-inserted check", "The compiler refuses to compile a line that ignores the result"], answer: 1, explain: "Low-level calls do not bubble exceptions. They return false, so ignoring `ok` hides a failure. That is why such calls are almost always followed by `require(ok)`." },
  { q: "After a function writes to storage and then hits a `revert`, what happens to the storage write?", options: ["It is kept, because storage is permanent once written","It is kept until the end of the block and then lost","It is undone with every other change","Only the first write is kept, later ones are undone"], answer: 2, explain: "An exception reverts all state changes made in the current call and its sub-calls. Unused gas is returned to the sender." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "hostel-custom-errors": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Hostel {
    bool public open = true;
    uint256 public rooms;

    constructor(uint256 total) {
        rooms = total;
    }

    // TODO: declare error Closed() and error NotEnoughRooms(uint256 requested, uint256 available)

    function book(uint256 n) external {
        // TODO: require(open, Closed());
        // TODO: if n exceeds rooms, revert NotEnoughRooms(n, rooms);
        // TODO: otherwise reduce rooms by n
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Hostel {
    error Closed();
    error NotEnoughRooms(uint256 requested, uint256 available);

    bool public open = true;
    uint256 public rooms;

    constructor(uint256 total) {
        rooms = total;
    }

    function book(uint256 n) external {
        require(open, Closed());
        if (n > rooms) revert NotEnoughRooms(n, rooms);
        rooms -= n;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "Hostel", kind: "error", name: "Closed", inputs: [], message: "Declares error Closed()" },
      { type: "abi", contract: "Hostel", kind: "error", name: "NotEnoughRooms", inputs: ["uint256", "uint256"], message: "Declares error NotEnoughRooms(uint256,uint256)" },
      { type: "regex", pattern: "require\\s*\\(\\s*open\\s*,\\s*Closed\\s*\\(\\s*\\)\\s*\\)", message: "Uses require(open, Closed())" },
      { type: "regex", pattern: "revert\\s+NotEnoughRooms\\s*\\(\\s*n\\s*,\\s*rooms\\s*\\)", message: "Uses revert NotEnoughRooms(n, rooms)" },
      { type: "regex", pattern: "rooms\\s*-=\\s*n\\s*;", message: "Reduces rooms by n" },
    ],
  },
};
