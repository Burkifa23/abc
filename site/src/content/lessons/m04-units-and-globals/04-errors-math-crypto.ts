import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "A caller passes an argument your function cannot accept. Which tool fits best?", options: ["`assert`, because it is stricter and uses less gas", "`require` or `revert`: bad input is an outside problem", "Nothing; let it overflow silently and check the result later", "`selfdestruct`, to remove the contract on bad input"], answer: 1, explain: "Input checks use require or revert. assert is for invariants that only a bug in your own code could break." },
  { q: "What does `addmod(23, 5, 24)` evaluate to?", options: ["4", "5", "28", "It reverts"], answer: 0, explain: "(23 + 5) % 24 is 28 % 24, which is 4. The addition is computed at full precision first." },
  { q: "Spot the bug: `mapping(bytes => bool) used; ... require(!used[sig]); used[sig] = true;` guards a signed voucher against replay.", options: ["`bytes` cannot be a mapping key, so the lookup is always empty", "`used` should be `uint256` so that it can hold signature hashes", "`require` cannot read a mapping", "Signatures are malleable, so a second valid one still passes"], answer: 3, explain: "For each valid (r, s) there is a second valid s with the same signer. Track the signed message or a nonce, not the signature bytes." },
  { q: "What does `ecrecover` do when the signature is invalid?", options: ["Reverts with a Panic", "Returns the caller's address", "Returns the zero address", "Returns `bytes32(0)`"], answer: 2, explain: "It signals failure with address(0), so the caller must check for that value before trusting the result." },
  { q: "What is the type of `ripemd160(data)`?", options: ["`bytes20`", "`bytes32`", "`uint160`", "`address`"], answer: 0, explain: "RIPEMD-160 produces 160 bits, so the result is bytes20. keccak256 and sha256 return bytes32." },
  { q: "Given `error NoSeats(); function f(uint256 s) external pure { require(s > 0, NoSeats()); }`, which compiler setup accepts it?", options: ["Any 0.8 version from 0.8.0 onwards", "Only compilers older than 0.8.4, which lack custom errors", "None; require cannot take a custom error at all", "0.8.26+ with viaIR, or 0.8.27+ on the legacy pipeline"], answer: 3, explain: "Custom errors inside require arrived in 0.8.26 for the IR pipeline and 0.8.27 for the default one. The `if ... revert` form works on all 0.8.4+ compilers." },
  { q: "A function that is reverted partway through consumed some gas already. What happens to the gas that was not yet used?", options: ["All of the gas is lost, including the unused part", "It goes to the contract owner as a refund", "The unused gas is returned to the caller", "It is burned as a penalty for the revert"], answer: 2, explain: "A revert undoes state changes and refunds the unused gas. Only exceptional failures such as running out of gas or an invalid opcode consume everything the frame had." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "toolbox": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Toolbox {
    function fingerprint(string calldata text) external pure returns (bytes32 out) {
        // TODO: Keccak-256 hash of the string's bytes
    }

    function wrap(uint256 a, uint256 b, uint256 m) external pure returns (uint256 out) {
        // TODO: (a + b) % m without overflowing at 2**256
    }

    function signer(bytes32 digest, uint8 v, bytes32 r, bytes32 s) external pure returns (address out) {
        // TODO: recover the address that signed the digest
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Toolbox {
    function fingerprint(string calldata text) external pure returns (bytes32 out) {
        out = keccak256(bytes(text));
    }

    function wrap(uint256 a, uint256 b, uint256 m) external pure returns (uint256 out) {
        out = addmod(a, b, m);
    }

    function signer(bytes32 digest, uint8 v, bytes32 r, bytes32 s) external pure returns (address out) {
        out = ecrecover(digest, v, r, s);
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "Toolbox", kind: "function", name: "fingerprint", inputs: ["string"], outputs: ["bytes32"], stateMutability: "pure", message: "fingerprint(string) returns bytes32" },
      { type: "abi", contract: "Toolbox", kind: "function", name: "signer", inputs: ["bytes32", "uint8", "bytes32", "bytes32"], outputs: ["address"], stateMutability: "pure", message: "signer(...) returns address" },
      { type: "regex", pattern: "keccak256\\s*\\(\\s*bytes\\s*\\(\\s*text\\s*\\)\\s*\\)", message: "fingerprint hashes bytes(text) with keccak256" },
      { type: "regex", pattern: "addmod\\s*\\(\\s*a\\s*,\\s*b\\s*,\\s*m\\s*\\)", message: "wrap uses addmod(a, b, m)" },
      { type: "regex", pattern: "ecrecover\\s*\\(\\s*digest\\s*,\\s*v\\s*,\\s*r\\s*,\\s*s\\s*\\)", message: "signer calls ecrecover(digest, v, r, s)" },
    ],
  },
};
