import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "A contract declares `function pay(uint amount, address to) external`. Which string is hashed to find its selector?", options: ["`pay(uint,address)`", "`pay(uint256 amount,address to)`", "`pay(uint256,address)`", "`pay(uint256, address)`"], answer: 2, explain: "The signature uses canonical type names (`uint` becomes `uint256`), no parameter names, and commas without spaces." },
  { q: "Which of these ABI types is dynamic?", options: ["`bytes32`, a fixed-size value of exactly 32 bytes","`uint256[3]`, an array with three static items","`address`, which is encoded like `uint160`","`(uint8,bytes)`, a tuple with a byte string"], answer: 3, explain: "A tuple is dynamic when any member is dynamic, and `bytes` is dynamic. `bytes32`, `address` and a fixed array of static items are all static and are written in place." },
  { q: "How is the `int8` value -2 written as a 32-byte argument word?", options: ["Thirty-one `ff` bytes followed by `fe`", "Thirty-one `00` bytes followed by `fe`", "`fe` followed by thirty-one `ff` bytes", "Thirty-one `00` bytes followed by `02`, with a separate sign flag"], answer: 0, explain: "Signed values are two's complement, sign-extended to the left with `ff` bytes. Non-negative values are padded with zeros instead." },
  { q: "For `function f(uint256 a, string memory s)` called with `(7, \"hi\")`, what is the offset word for `s` in the arguments?", options: ["0x20", "0x00", "0x40", "0x44"], answer: 2, explain: "The head has two words (a and the offset), so the string's data starts after 2 x 32 = 0x40 bytes. Offsets count from the start of the arguments, not from the selector, which is why it is not 0x44." },
  { q: "Spot the bug: `function id(string memory a, string memory b) public pure returns (bytes32) { return keccak256(abi.encodePacked(a, b)); }` is used to identify (name, course) pairs. What goes wrong?", options: ["`abi.encodePacked` cannot take `string` arguments, so the function would not even compile","The result is always only the hash of the first string, because the second is ignored","Hashes of packed strings are always shorter than 32 bytes, which breaks lookups","With the lengths gone, `(\"ab\", \"c\")` and `(\"a\", \"bc\")` hash alike, so pairs collide"], answer: 3, explain: "Packed encoding drops the length fields, so moving a character from one string to the other leaves the bytes unchanged. Use `abi.encode`, or make sure at most one argument is dynamic." },
  { q: "An event is declared `event Tagged(string indexed label, uint256 n)`. What does topic 1 contain when it is emitted with `\"lab\"`?", options: ["The ABI encoding of the string, with offset and length", "The Keccak-256 hash of the string's bytes", "The string right-padded to 32 bytes", "The first 32 bytes of the string, and an overflow topic if longer"], answer: 1, explain: "Indexed parameters of dynamic type are stored as a hash of their contents. You can search for a known string but cannot decode the original from the log." },
  { q: "A function reverts with `revert NotEnoughSeats(4, 10);` where the error is `NotEnoughSeats(uint256 left, uint256 wanted)`. What do the first four bytes of the return data identify?", options: ["The error's signature hash, 0xc4ed54c8", "Always the `Error(string)` selector, 0x08c379a0", "The offset of the first argument", "The selector 0x00000000, reserved for custom errors"], answer: 0, explain: "A custom error is encoded like a function call named after the error: its selector, then the arguments. `0x08c379a0` belongs to `Error(string)`, and the selectors `0x00000000` and `0xffffffff` are reserved, not used for errors." },
  { q: "A hand-written encoder gives a string offset of 0x60 where the strict encoding would give 0x40, leaving a gap of unused words before the data. What will Solidity's own decoder do?", options: ["It always reverts, because only strict encodings are valid ABI data for a decoder","It follows the offset and decodes, as it does not enforce strict mode","It silently reads the unused gap as if it were part of the string's bytes","It rewrites the offset to 0x40 in place and continues decoding from there"], answer: 1, explain: "Solidity's encoder always produces strict output, but its decoder follows any offset that points to valid data. Relying on that is fragile, because stricter decoders exist." },
];

const head = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SelectorLab {
`;

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  selector: {
    starter: `${head}    // TODO: return the 4-byte selector of transfer(address,uint256),
    // computed from its signature string. Do not paste the hex constant.
    function transferSelector() external pure returns (bytes4) {
        return bytes4(0);
    }
}
`,
    solution: `${head}    function transferSelector() external pure returns (bytes4) {
        return bytes4(keccak256("transfer(address,uint256)"));
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "SelectorLab", kind: "function", name: "transferSelector", inputs: [], outputs: ["bytes4"], stateMutability: "pure", message: "Has pure transferSelector() returning bytes4" },
      { type: "regex", pattern: "bytes4\\s*\\(\\s*keccak256\\s*\\(\\s*\"transfer\\(address,uint256\\)\"\\s*\\)\\s*\\)", message: "Computes bytes4(keccak256(\"transfer(address,uint256)\"))" },
      { type: "regex", pattern: "^(?![\\s\\S]*0xa9059cbb)", flags: "i", message: "Does not paste the finished constant" },
    ],
  },
};
