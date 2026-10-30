import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "What does `ecrecover(hash, v, r, s)` return when the signature is invalid?", options: ["It reverts with a message saying the signature is invalid", "The address of the contract that called it", "`address(0)`, so the caller must check for it", "The hash that was passed in, converted to an address"], answer: 2, explain: "`ecrecover` does not revert on bad input; it returns the zero address. Failing to reject zero can let a forged signature match an unset address." },
  { q: "Why does the channel contract include `address(this)` in the signed digest?", options: ["So the contract can look up its own balance at the time of payout", "So a signature for one channel cannot be replayed on another one", "Because `keccak256` refuses to hash fewer than three values", "To prove that the student deployed the contract on her own"], answer: 1, explain: "A message that names the contract is only valid there. Without it, the same signed amount could be presented to any other channel the student has opened with the same shop." },
  { q: "Why do wallets and contracts use the `\\x19Ethereum Signed Message:\\n32` prefix?", options: ["It makes the signature shorter, and so cheaper to verify on chain", "It is required by the EVM before `ecrecover` is allowed to run", "It stops users signing a real transaction hash by mistake", "It encrypts the message so that only the contract can read it later"], answer: 2, explain: "EIP-191 prepends a fixed text, so a hash signed for a message can never double as a signed transaction. The contract must rebuild the same prefixed hash before recovering." },
  { q: "Spot the bug: `address signer = ecrecover(digest, v, r, s); require(signer == expected);` where `expected` is a state variable that was never set.", options: ["`require` cannot be used with an address comparison", "`ecrecover` can only be called from inside a `view` function", "A bad signature recovers address(0), equal to the unset `expected`", "The digest must be hashed once more before `ecrecover` receives it"], answer: 2, explain: "A bad signature returns the zero address, and an unset address is also zero. The comparison succeeds for garbage. Reject `address(0)` explicitly and make sure the expected signer is set." },
  { q: "What problem does signature malleability create?", options: ["The original and a mirrored signature both verify for one message", "The private key can be recovered from two signatures of one message", "Signatures expire after a handful of blocks and stop verifying", "The signer's address changes every time a message gets signed"], answer: 0, explain: "Because both versions recover the same signer, anything that treats the signature bytes as a unique ID can be bypassed with the mirror. Requiring `s` in the lower half removes the duplicate." },
  { q: "In the print-shop channel, why does each new signed message state the total owed instead of the latest increment?", options: ["Increments cannot be hashed with `abi.encodePacked` in Solidity at all", "The shop needs only the latest note, and no page is paid twice", "So that the student can decide to pay less than she has signed for", "Because `uint256` cannot store small numbers precisely enough here"], answer: 1, explain: "A cumulative total makes older notes obsolete: submitting the latest one settles everything. With increments, the shop would have to submit every note and could replay old ones." },
  { q: "The shop disappears and never closes the channel. How does the student get her locked ether back?", options: ["She calls `reclaim()` after `expiresAt` and takes back the balance", "She asks the shop to sign a refund note, which nobody can force it to do", "She calls `close()` with any amount and her own signature", "She cannot, because the ether stays locked until the shop returns"], answer: 0, explain: "The expiry exists for exactly this case. After `expiresAt` the student can reclaim the balance, which is why the shop must close before it passes." },
];

const head = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SignatureChecker {
    error InvalidSignature();

    function recoverSigner(bytes32 digest, bytes memory sig) public pure returns (address) {
        if (sig.length != 65) revert InvalidSignature();

        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
`;

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "recover-signer": {
    starter: head + `
        // TODO:
        // 1. revert InvalidSignature() if uint256(s) is above the lower-half bound
        //    0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0
        // 2. recover the signer with ecrecover(digest, v, r, s)
        // 3. revert InvalidSignature() if the result is the zero address
        return address(0);
    }
}
`,
    solution: head + `
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) {
            revert InvalidSignature();
        }
        address signer = ecrecover(digest, v, r, s);
        if (signer == address(0)) revert InvalidSignature();
        return signer;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "SignatureChecker", kind: "function", name: "recoverSigner", inputs: ["bytes32", "bytes"], outputs: ["address"], stateMutability: "pure", message: "Has recoverSigner(bytes32,bytes) pure returns (address)" },
      { type: "regex", pattern: "ecrecover\\s*\\(\\s*digest\\s*,\\s*v\\s*,\\s*r\\s*,\\s*s\\s*\\)", message: "Calls ecrecover(digest, v, r, s)" },
      { type: "regex", pattern: "==\\s*address\\s*\\(\\s*0\\s*\\)", message: "Checks for the zero address" },
      { type: "regex", pattern: "revert\\s+InvalidSignature\\s*\\(", message: "Reverts with InvalidSignature on bad input" },
      { type: "regex", pattern: "0x7f{31}5d576e7357a4501ddfe92f46681b20a0", flags: "i", message: "Rejects high-s (malleable) signatures with the lower-half bound" },
    ],
  },
};
