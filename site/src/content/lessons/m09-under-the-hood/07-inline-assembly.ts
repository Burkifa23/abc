import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Block one declares `let total := 5` and a second block in the same function reads `total`. What happens?", options: ["It compiles, because both blocks belong to the same Solidity function and share its scope", "It compiles only if the second block repeats `let total`", "It fails: the blocks share no namespace, so `total` is unknown in the second", "It compiles and `total` is 5, since Yul variables live on the stack"], answer: 2, explain: "Each assembly block is its own scope. You cannot call a Yul function or read a Yul variable declared in a different block; copy the value into a Solidity variable if you need to carry it across." },
  { q: "Spot the bug: the author annotates `assembly (\"memory-safe\") { returndatacopy(0, 0, returndatasize()) revert(0, returndatasize()) }` to forward a failed call's error data. What is wrong?", options: ["`revert` cannot be used inside assembly at all, only `require` can", "The annotation is false: return data can exceed the 64 scratch bytes and overwrite the free pointer", "`returndatacopy` must be preceded by an update of the free memory pointer, which was skipped", "Nothing is wrong; copying to offset 0 is the standard safe pattern for forwarding errors, and the annotation is correct"], answer: 1, explain: "Only offsets 0x00 to 0x3f are scratch space. Return data may be longer, so this clobbers the free pointer at 0x40 and the zero slot at 0x60. Copy to `mload(0x40)` instead; memory after the free pointer is safe temporary space." },
  { q: "With `contract C { uint8 a; uint8 b; function where() external pure returns (uint256 s, uint256 o) { assembly { s := b.slot o := b.offset } } }`, what does `where()` return?", options: ["s = 1, o = 0, because each variable gets a slot of its own", "s = 0, o = 0, because offsets only matter for structs", "s = 1, o = 1, since `b` is the second variable declared in the contract", "s = 0, o = 1: `a` and `b` pack into slot 0 and `b` starts one byte in"], answer: 3, explain: "Two one-byte variables pack into the same slot. `b.slot` is 0 and `b.offset` is 1, the byte position inside that slot." },
  { q: "Why does `function widen(uint64 t) external pure returns (uint256 r) { assembly { r := and(t, 0xffffffffffffffff) } }` bother with the `and`?", options: ["`and` converts the number to an unsigned type, which `mload` requires", "Narrow variables may hold unspecified bits above their type, so assembly must clean them itself", "Without it the compiler refuses to compile any assignment into a `uint256` variable from a narrower type", "It makes the block memory-safe by limiting the value to 64 bits"], answer: 1, explain: "The compiler cleans narrow types only when it needs to (before storing, comparing and so on). Inside assembly you see the raw word, so zero the upper bits yourself, or use `signextend` for signed types." },
  { q: "Which of these can an inline assembly block do with a Solidity *function*?", options: ["Read and assign `.address` and `.selector` of a variable of external function type", "Call any internal function by writing its name as a Yul call, like an ordinary Yul function", "Read the code offset of an internal function through its `.address` member", "Nothing; functions are invisible to assembly in every form"], answer: 0, explain: "Functions cannot be accessed by name from assembly. The exception is the two parts of an external function pointer, the target address and the four-byte selector. Internal pointers do not offer them." },
  { q: "On entry to a fresh external call, what does the word at memory offset 0x40 contain, and where does allocatable memory start?", options: ["0x40 and 0x40: the pointer points at itself", "0x80 in both cases: the free pointer starts at 0x80 and allocation begins there", "0x00 and 0x20: the free pointer starts at the very beginning of memory and moves up", "0x60 and 0x80: the pointer starts at the zero slot"], answer: 1, explain: "Offsets 0x00 to 0x3f are scratch, 0x40 holds the free memory pointer, 0x60 is the zero slot, and the pointer's initial value is 0x80, where the first allocation goes." },
  { q: "An assembly block borrows the word at 0x60 as extra scratch and then returns to ordinary Solidity code. What must it do to remain memory-safe?", options: ["Nothing; 0x60 is part of the standard scratch space", "Write the old free pointer into 0x60 so that later code can find it again", "Restore the word at 0x60 to zero and leave a sane free memory pointer before finishing", "Double the free memory pointer so that Solidity skips over the damaged region of memory entirely"], answer: 2, explain: "0x60 is the zero slot that empty dynamic arrays point to. You may use it temporarily only if you put the zero back and leave the free pointer valid, or if the block never returns to Solidity code." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "add-words": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract WordMath {
    function addWords(uint256 a, uint256 b) external pure returns (uint256 r) {
        // TODO: compute r inside an inline assembly block using the add opcode.
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract WordMath {
    function addWords(uint256 a, uint256 b) external pure returns (uint256 r) {
        assembly ("memory-safe") {
            r := add(a, b)
        }
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "WordMath", kind: "function", name: "addWords", inputs: ["uint256", "uint256"], outputs: ["uint256"], stateMutability: "pure", message: "Still has pure addWords(uint256,uint256) returns (uint256)" },
      { type: "regex", pattern: "assembly\\s*(?:\\(\\s*\"memory-safe\"\\s*\\)\\s*)?\\{[^}]*\\br\\s*:=\\s*add\\s*\\(\\s*a\\s*,\\s*b\\s*\\)", message: "An assembly block assigns r := add(a, b)" },
      { type: "regex", pattern: "^(?![\\s\\S]*\\ba\\s*\\+\\s*b\\b)", message: "Does not fall back to the checked Solidity a + b" },
    ],
  },
};
