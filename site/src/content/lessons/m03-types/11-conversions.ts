import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { "q":"```solidity\nuint32 a = 0xA1B2C3D4;\nuint16 b = uint16(a);\n```\nWhat is `b`?","options":["0xA1B2","0xC3D4","0xA1B2C3D4","It reverts"],"answer":1,"explain":"Narrowing an integer drops the high-order bits and keeps the low ones, so 0xC3D4 remains." },
  { "q":"```solidity\nbytes4 id = 0xCAFEF00D;\nbytes2 h = bytes2(id);\n```\nWhat is `h`?","options":["0xCAFE","0xF00D","0x0000","0xCAFEF00D"],"answer":0,"explain":"Fixed bytes behave like byte sequences: narrowing keeps the first (high) bytes." },
  { "q":"Which line is allowed?","options":["`bytes3 b = 0xA1B2;`","`bytes3 b = 255;`","`bytes3 b = 0xA1B2C3;`","`bytes3 b = \"lion\";`"],"answer":2,"explain":"A hex literal must fill the type exactly. 0xA1B2 is too short, a non-zero decimal is never allowed, and \"lion\" is 4 bytes." },
  { "q":"```solidity\nint256 n = -3;\nuint256 u = uint256(n);\n```\nWhat is `u`?","options":["3","0","It reverts","A very large number just below 2^256"],"answer":3,"explain":"The 256 bits are kept and read as unsigned. -3 in two's complement is 0xff...fd." },
  { "q":"Spot the bug: `address a = address(someUint256);` where `someUint256` is a `uint256`. What is wrong?","options":["Nothing; this compiles","Only `uint160` (or `bytes20`) can be converted explicitly to address","`address(...)` needs `payable`","A literal is required"],"answer":1,"explain":"Write `address(uint160(someUint256))` so that the narrowing step is explicit." },
  { "q":"Why is `uint16 x = 0x1A2B3C;` rejected?","options":["Hex literals cannot be assigned to integers","The literal does not fit in 16 bits, so it would be truncated","`uint16` is too small for any hex","It needs an explicit cast"],"answer":1,"explain":"A literal converts only if it fits the target. Since 0.8.0 even an explicit cast of such a literal is refused." },
  { "q":"```solidity\nuint32 seats = 120;\nuint8 rows = 7;\nuint256 n = seats * rows;\n```\nIn which type is the multiplication performed?","options":["`uint8`","`uint64`","`uint32`","`uint256`"],"answer":2,"explain":"`rows` is widened to the other operand's type, uint32. The result is then widened to uint256 for the assignment." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "casts-explicit": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Casts {
    // TODO: keep only the low 8 bits of x
    function low8(uint256 x) external pure returns (uint8) {
        return 0;
    }

    // TODO: reinterpret the same 256 bits as signed
    function asSigned(uint256 x) external pure returns (int256) {
        return 0;
    }

    // TODO: keep the first two bytes of b
    function head2(bytes4 b) external pure returns (bytes2) {
        return 0;
    }

    // TODO: the address as a number
    function toId(address a) external pure returns (uint160) {
        return 0;
    }

    // TODO: the number as an address
    function fromId(uint160 id) external pure returns (address) {
        return address(0);
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Casts {
    function low8(uint256 x) external pure returns (uint8) {
        return uint8(x);
    }

    function asSigned(uint256 x) external pure returns (int256) {
        return int256(x);
    }

    function head2(bytes4 b) external pure returns (bytes2) {
        return bytes2(b);
    }

    function toId(address a) external pure returns (uint160) {
        return uint160(a);
    }

    function fromId(uint160 id) external pure returns (address) {
        return address(id);
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "noWarnings" },
      { type: "abi", contract: "Casts", kind: "function", name: "low8", inputs: ["uint256"], outputs: ["uint8"], stateMutability: "pure", message: "Has pure low8(uint256) returning uint8" },
      { type: "abi", contract: "Casts", kind: "function", name: "asSigned", inputs: ["uint256"], outputs: ["int256"], stateMutability: "pure", message: "Has pure asSigned(uint256) returning int256" },
      { type: "abi", contract: "Casts", kind: "function", name: "head2", inputs: ["bytes4"], outputs: ["bytes2"], stateMutability: "pure", message: "Has pure head2(bytes4) returning bytes2" },
      { type: "abi", contract: "Casts", kind: "function", name: "toId", inputs: ["address"], outputs: ["uint160"], stateMutability: "pure", message: "Has pure toId(address) returning uint160" },
      { type: "abi", contract: "Casts", kind: "function", name: "fromId", inputs: ["uint160"], outputs: ["address"], stateMutability: "pure", message: "Has pure fromId(uint160) returning address" },
      { type: "regex", pattern: "uint8\\s*\\(\\s*x\\s*\\)", message: "low8 casts x with uint8(x)" },
      { type: "regex", pattern: "int256\\s*\\(\\s*x\\s*\\)", message: "asSigned casts x with int256(x)" },
      { type: "regex", pattern: "bytes2\\s*\\(\\s*b\\s*\\)", message: "head2 casts b with bytes2(b)" },
      { type: "regex", pattern: "uint160\\s*\\(\\s*a\\s*\\)", message: "toId casts a with uint160(a)" },
      { type: "regex", pattern: "address\\s*\\(\\s*id\\s*\\)", message: "fromId casts id with address(id)" },
    ],
  },
};
