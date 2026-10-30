import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Why does the commitment include a random `secret`?", options: ["The EVM refuses to hash a bare number that is not mixed with other data", "Observers could hash likely values and compare them with it", "The secret becomes the winner's address", "It makes the stored hash shorter, and so cheaper to keep on the chain"], answer: 1, explain: "Bids tend to be round numbers. A long random secret stops anyone from guessing the value by hashing candidates until one matches the public fingerprint." },
  { q: "What is the purpose of the `fake` flag?", options: ["It marks a decoy envelope, hiding which deposit belongs to a real bid", "It lets the auctioneer cancel any bid before the bidding deadline arrives", "It tells the contract to skip the hash comparison during the reveal", "It records that the bidder used a second wallet for the same bid"], answer: 0, explain: "Deposits are public. Decoy commitments with big deposits blur the link between deposit size and real bid. Fake bids never count and their deposits are returned." },
  { q: "A bidder commits value 100 but attaches a deposit of 1. What should `reveal` do when the hash matches and `fake` is false?", options: ["Accept the bid and make the bidder pay the missing amount at settlement", "Accept the bid for a value of 1, the real deposit", "Never let it lead, since the deposit is below the value", "Revert the whole reveal call for every envelope that this bidder owns"], answer: 2, explain: "The deposit must cover the value (`deposit >= value`). Otherwise the winner could owe the fund more than they put in, with the shortfall paid out of other bidders' deposits." },
  { q: "Spot the bug in this reveal check: `if (env.hash == blind(v, f, sec)) { _tryLead(bidder, v); }` where `_tryLead` credits the old leader's amount.", options: ["`blind` is `pure`, so it cannot be called from inside a loop", "It should compare against `keccak256(v)` instead", "It ignores `f` and `deposit >= v`, so decoys and short bids can lead", "The function should have been marked `payable` in order to read the secret"], answer: 2, explain: "A matching hash only proves the opening is genuine. A fake must not count, and a bid whose deposit is below its value must not lead." },
  { q: "Why is the commitment hash set to `bytes32(0)` after a successful opening?", options: ["It stops one envelope being opened and refunded twice", "It frees storage, so the whole struct is deleted automatically for you", "The next call to `blind` needs the previous stored hash to be empty", "It marks the bid as fake, so that it will never be refunded"], answer: 0, explain: "Without clearing, a bidder could call `reveal` repeatedly and collect the same deposit refund each time." },
  { q: "Which statement about `abi.encodePacked(value, fake, secret)` is correct?", options: ["It pads each item out to 32 bytes, in the same way as `abi.encode` does", "It can only be used inside functions that are marked `view`", "It always reverts when any one of the items is a `bool` value", "It joins raw bytes without padding; unambiguous here as all sizes are fixed"], answer: 3, explain: "`encodePacked` joins the raw bytes. With fixed-size types the boundaries are known; with two dynamic types, different inputs can produce the same bytes." },
  { q: "During the reveal window a bidder's opening has a wrong secret. What happens in `_open`?", options: ["The call reverts and every envelope of that bidder is forfeited for good", "The hash matches anyway, because the value itself is correct", "Nothing is paid out and the bidder may retry before the window closes", "The deposit is refunded at once, as if the bid had been a fake"], answer: 2, explain: "A mismatch makes `_open` return 0 and leaves the stored hash alone, so that deposit stays locked. Reveal can be called again before `revealEnd`; after it, an unopened envelope's deposit stays locked for good." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "blind-commit": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SealedBids {
    struct Sealed {
        bytes32 hash;
        uint256 deposit;
    }

    mapping(address => Sealed[]) public sealedBids;

    // TODO: return the Keccak-256 hash of the packed value, fake and secret (in that order)
    function blind(uint256 value, bool fake, bytes32 secret)
        public pure returns (bytes32)
    {
        return bytes32(0);
    }

    function commit(bytes32 hash) external payable {
        sealedBids[msg.sender].push(Sealed(hash, msg.value));
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SealedBids {
    struct Sealed {
        bytes32 hash;
        uint256 deposit;
    }

    mapping(address => Sealed[]) public sealedBids;

    function blind(uint256 value, bool fake, bytes32 secret)
        public pure returns (bytes32)
    {
        return keccak256(abi.encodePacked(value, fake, secret));
    }

    function commit(bytes32 hash) external payable {
        sealedBids[msg.sender].push(Sealed(hash, msg.value));
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "SealedBids", kind: "function", name: "blind", inputs: ["uint256", "bool", "bytes32"], outputs: ["bytes32"], stateMutability: "pure", message: "Has blind(uint256,bool,bytes32) pure returns (bytes32)" },
      { type: "regex", pattern: "keccak256\\s*\\(\\s*abi\\.encodePacked\\s*\\(\\s*value\\s*,\\s*fake\\s*,\\s*secret\\s*\\)\\s*\\)", message: "Hashes keccak256(abi.encodePacked(value, fake, secret))" },
      { type: "regex", pattern: "return\\s+keccak256", message: "Returns the hash" },
    ],
  },
};
