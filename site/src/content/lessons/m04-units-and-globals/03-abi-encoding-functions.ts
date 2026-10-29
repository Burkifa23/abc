import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Why does `abi.decode(data, (uint256))` need the type list?", options: ["Encoded bytes carry no type labels, so you must say how to read them", "It makes decoding faster", "The compiler cannot parse bytes otherwise", "It is only a style requirement"], answer: 0, explain: "The ABI layout has no tags. The same 32 bytes could be an integer, an address or a hash, so the caller names the types." },
  { q: "What does this return? `keccak256(abi.encodePacked(\"ab\", \"c\")) == keccak256(abi.encodePacked(\"a\", \"bc\"))`", options: ["`false`, because the strings differ", "`true`, because both pack to the bytes `abc`", "It does not compile", "It reverts"], answer: 1, explain: "Packed encoding adds no lengths or padding to strings, so the boundary between them is lost and the hashes match." },
  { q: "Spot the bug: `bytes memory data = abi.encodeWithSignature(\"setMark(uint,uint8)\", 7, 85);` is meant to call `setMark(uint256,uint8)`.", options: ["`encodeWithSignature` can only take one argument", "The signature must use the canonical type `uint256`, otherwise the selector is wrong", "`85` must be written as `0x55`", "The function name must be uppercase"], answer: 1, explain: "The selector is a hash of the exact canonical signature text. `uint` hashes differently from `uint256`, so the call goes to a function that does not exist." },
  { q: "What is the main advantage of `abi.encodeCall` over `abi.encodeWithSelector`?", options: ["It produces shorter bytes", "The compiler checks the arguments against the function's parameter types", "It works for any contract without an interface", "It sends the call as well"], answer: 1, explain: "encodeCall takes the function itself, so the types are checked at compile time. The bytes it produces are the same as with the selector." },
  { q: "What does `string.concat(\"CS\", \"-\", \"314\")` return?", options: ["`CS314`", "`CS-314`", "`CS - 314`", "A `bytes` value"], answer: 1, explain: "It joins its arguments exactly as given, with no separators added. The result is a string memory value." },
  { q: "You hash a student's first and last names together as strings. Which expression avoids ambiguity?", options: ["`keccak256(abi.encodePacked(first, last))`", "`keccak256(bytes.concat(bytes(first), bytes(last)))`", "`keccak256(abi.encode(first, last))`", "`keccak256(string.concat(first, last))`"], answer: 2, explain: "Only abi.encode records where each dynamic value starts and ends. The other three simply join the text, so different name pairs can give identical bytes." },
  { q: "How many bytes does `abi.encode(uint8(5))` produce?", options: ["1", "4", "32", "64"], answer: 2, explain: "The standard layout pads every value to a whole 32-byte slot. Only encodePacked would give a single byte." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "encoder": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ITarget {
    function setScore(uint256 id, uint8 score) external;
}

contract Encoder {
    function standard(address who, uint256 n) external pure returns (bytes memory out) {
        // TODO: ABI-encode who and n in the standard padded layout
    }

    function compact(address who, uint256 n) external pure returns (bytes memory out) {
        // TODO: pack who and n with no padding
    }

    function prepare(uint256 id, uint8 score) external pure returns (bytes memory out) {
        // TODO: type-checked calldata for ITarget.setScore
    }

    function fullName(string calldata first, string calldata last) external pure returns (string memory out) {
        // TODO: join first and last with a single space
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ITarget {
    function setScore(uint256 id, uint8 score) external;
}

contract Encoder {
    function standard(address who, uint256 n) external pure returns (bytes memory out) {
        out = abi.encode(who, n);
    }

    function compact(address who, uint256 n) external pure returns (bytes memory out) {
        out = abi.encodePacked(who, n);
    }

    function prepare(uint256 id, uint8 score) external pure returns (bytes memory out) {
        out = abi.encodeCall(ITarget.setScore, (id, score));
    }

    function fullName(string calldata first, string calldata last) external pure returns (string memory out) {
        out = string.concat(first, " ", last);
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "Encoder", kind: "function", name: "prepare", inputs: ["uint256", "uint8"], outputs: ["bytes"], stateMutability: "pure", message: "prepare(uint256,uint8) is pure and returns bytes" },
      { type: "regex", pattern: "abi\\.encode\\s*\\(\\s*who\\s*,\\s*n\\s*\\)", message: "standard uses abi.encode(who, n)" },
      { type: "regex", pattern: "abi\\.encodePacked\\s*\\(\\s*who\\s*,\\s*n\\s*\\)", message: "compact uses abi.encodePacked(who, n)" },
      { type: "regex", pattern: "abi\\.encodeCall\\s*\\(\\s*ITarget\\.setScore\\s*,\\s*\\(\\s*id\\s*,\\s*score\\s*\\)\\s*\\)", message: "prepare uses abi.encodeCall(ITarget.setScore, (id, score))" },
      { type: "regex", pattern: "string\\.concat\\s*\\(\\s*first\\s*,[^)]*last\\s*\\)", message: "fullName uses string.concat with first and last" },
    ],
  },
};
