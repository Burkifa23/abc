import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "If `bytes4 tag = 0xc0ffee01;`, what does `tag[0]` give?", options: ["`0x01`", "`0xc0` as a `bytes1`", "`0xc0` as a `uint8`", "A panic, because bytes4 cannot be indexed"], answer: 1, explain: "Index 0 is the leftmost (most significant) byte and the type of the result is `bytes1`." },
  { q: "Which statement about `bytes32 h; h[0] = 0x01;` is true?", options: ["It does not compile; the bytes are read-only", "It sets the first byte and leaves the rest alone", "It compiles but reverts when the line is executed", "It resizes `h` to make room for the new byte"], answer: 0, explain: "Fixed-size byte arrays can be indexed for reading only. Build a whole new value instead." },
  { q: "What is the value of `(2**200 + 7) - 2**200` as a pure literal expression?", options: ["It overflows and fails to compile", "0", "7", "2**200"], answer: 2, explain: "Literal expressions are computed with arbitrary precision, so the huge intermediate is no problem and the result is exactly 7." },
  { q: "```solidity\nbytes4 b = \"AB\";\n```\nWhat bytes does `b` hold?", options: ["`0x00004142`", "`0x41420000`", "`0x4142`", "It does not compile"], answer: 1, explain: "A string literal that is shorter than the target is padded with zero bytes on the right." },
  { q: "Spot the bug: `string constant S = \"Akwaaba ✓\";`", options: ["Strings cannot be declared as constants here", "The semicolon is in the wrong place here", "`✓` is a reserved character in Solidity", "Non-ASCII text needs the `unicode` prefix"], answer: 3, explain: "Plain string literals only allow printable ASCII. Write `unicode\"Akwaaba ✓\"` for real UTF-8 text." },
  { q: "What happens with the address literal `0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed` (all lowercase) in source?", options: ["It is accepted as an ordinary address after a warning", "It becomes a `uint160` holding the same bits", "It is an error: the case pattern fails the checksum", "It becomes a `bytes20` with the same value"], answer: 2, explain: "A 40-digit hex literal that fails the EIP-55 checksum is rejected, and the compiler shows the correct spelling." },
  { q: "```solidity\nuint y = 5 / 2;\n```\nWhat happens?", options: ["`y` is 2, because rational literals are rounded down", "It does not compile: the literal is exactly 2.5", "`y` is 3, because rational literals are rounded up", "It reverts at runtime with a Panic"], answer: 1, explain: "Two literals divide into an exact rational, 2.5, which cannot become an integer. With variables the result would be 2." },
  { q: "How many bytes does `hex\"c0ff_ee01\"` contain?", options: ["4", "8", "5", "It is invalid because of the underscore"], answer: 0, explain: "Underscores between bytes are only separators. Eight hex digits are four bytes." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "magic-constants": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Tags {
    // TODO: bytes4 constant MAGIC from a hex"..." literal (4 bytes)
    // TODO: string constant GREETING from a unicode"..." literal

    function magic() public pure returns (bytes4) {
        return bytes4(0);
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Tags {
    bytes4 constant MAGIC = hex"c0ff_ee01";
    string constant GREETING = unicode"Akwaaba ✓";

    function magic() public pure returns (bytes4) {
        return MAGIC;
    }

    function greeting() public pure returns (string memory) {
        return GREETING;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "regex", pattern: "bytes4\\s+(public\\s+)?constant\\s+MAGIC\\s*=\\s*hex\\s*\"[0-9a-fA-F_]+\"", message: "MAGIC is a bytes4 constant set from a hex literal" },
      { type: "regex", pattern: "string\\s+(public\\s+)?constant\\s+GREETING\\s*=\\s*unicode\\s*\"[^\"]+\"", message: "GREETING is a string constant set from a unicode literal" },
    ],
  },
};
