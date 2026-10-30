import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "How many storage slots do the variables in `contract T { uint8 a; uint256 b; uint8 c; }` occupy?", options: ["1", "2", "4", "3"], answer: 3, explain: "`a` takes slot 0. `b` needs a full slot, so it starts slot 1. `c` follows a full-slot value and cannot join it, so it starts slot 2. Declaring `b` last would have used two slots." },
  { q: "A `uint256[] ids` is declared in slot 2. Where is `ids[5]` stored?", options: ["Slot 7, directly after the array's own slot, since arrays grow upward","Slot `keccak256(2) + 5`; slot 2 itself holds the length","Slot `keccak256(5 . 2)`, the way a mapping value would be placed","Slot 2, offset 5, packed inside the same word as the length"], answer: 1, explain: "A dynamic array keeps its length at slot p and its elements from keccak256(p) onward, one after another. The `keccak256(key . p)` form belongs to mappings." },
  { q: "What does the slot of a `mapping` variable itself contain?", options: ["It stays empty; it only keeps the mapping's values apart from the others","The number of keys that have been written so far, updated on each set","The hash of the first key that was ever used with this particular mapping variable","A pointer to the most recently written value, for fast repeat lookups"], answer: 0, explain: "The mapping's own slot is never written. It is only an input to `keccak256(h(k) . p)`, which makes two mappings declared next to each other store their values in different places." },
  { q: "Spot the bug: `contract Gate { uint256 total; uint256 transient lock; function peek() external view returns (uint256 l) { assembly { l := tload(1) } } }`. The author expects `peek` to read `lock`. What is wrong?", options: ["`tload` can only be used inside a constructor, never in a view function","`lock` is unreadable because every transient variable is always private","`lock` is transient slot 0, since transient numbering starts at 0 on its own","`total` has to be declared after `lock` before slot 1 becomes a valid transient location"], answer: 2, explain: "Storage and transient storage are independent shelves. `total` takes storage slot 0 and `lock` takes transient slot 0, so `tload(1)` reads an unused location." },
  { q: "The string `\"abc\"` is stored in a state variable. What is in its slot?", options: ["`abc` left-aligned in the high bytes, and `0x06` (length × 2) in the lowest byte","`abc` right-aligned, and `0x03` (the plain length) in the highest byte of the slot","Only the number 3, with the characters kept at `keccak256` of the slot","Only the characters, because the length is found by scanning for the end"], answer: 0, explain: "Short `bytes` and `string` values (up to 31 bytes) share the slot with their length: data on the left, length × 2 in the lowest byte. A set lowest bit would mean a long value stored elsewhere." },
  { q: "In `contract Kid is Base layout at 100 { uint16 c; }` where `Base` declares `uint a; uint8 b;`, which statement is right?", options: ["`a` stays in slot 0 and only `c` moves up to slot 100 as the derived variable","`a` is in slot 100, `b` in slot 101, and `c` shares slot 101 with `b`","`a`, `b` and `c` all end up in slot 100, because they are small","The code does not compile because `Base` has no `layout` statement"], answer: 1, explain: "The base slot applies to the whole hierarchy, starting from the most base contract. `a` fills slot 100, `b` starts 101 and `c` packs next to it at offset 1." },
  { q: "Which of these is a sound reason NOT to shrink every variable to the smallest type?", options: ["The compiler refuses to pack types smaller than `uint64` into a shared slot, so the saving only exists on paper","Writing one packed variable first reads the shared slot and merges, so separate updates can cost more","Smaller integers cannot be used as `mapping` keys or as members of a struct in storage","Storage packing is switched off automatically whenever the optimizer is enabled"], answer: 1, explain: "Packing saves gas when packed variables are accessed together. If you update them separately, each write is a read-modify-write of the whole word. Memory and arguments are not packed, so shrinking those gains nothing." },
];

const head = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SeatSale {
`;

const tail = `
    constructor(uint64 o, uint64 c, uint128 f, uint128 d, uint256 b) {
        opensAt = o;
        closesAt = c;
        fee = f;
        deposit = d;
        budget = b;
    }
}
`;

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  pack: {
    starter: `${head}    // TODO: these five variables take four storage slots.
    // Reorder the declarations so they take three.
    uint64 public opensAt;
    uint256 public budget;
    uint64 public closesAt;
    uint128 public fee;
    uint128 public deposit;
${tail}`,
    solution: `${head}    uint64 public opensAt;
    uint64 public closesAt;
    uint128 public fee;
    uint128 public deposit;
    uint256 public budget;
${tail}`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "SeatSale", kind: "function", name: "budget", inputs: [], outputs: ["uint256"], stateMutability: "view", message: "Still has the public uint256 budget" },
      { type: "regex", pattern: "uint64\\s+(?:public\\s+)?opensAt\\s*;\\s*uint64\\s+(?:public\\s+)?closesAt\\s*;|uint64\\s+(?:public\\s+)?closesAt\\s*;\\s*uint64\\s+(?:public\\s+)?opensAt\\s*;", message: "opensAt and closesAt are declared next to each other, so they can share a slot" },
      { type: "regex", pattern: "^(?=[\\s\\S]*uint256\\s+(?:public\\s+)?budget\\s*;)(?=[\\s\\S]*uint128\\s+(?:public\\s+)?fee\\s*;)(?=[\\s\\S]*uint128\\s+(?:public\\s+)?deposit\\s*;)", message: "Keeps budget as uint256 and fee and deposit as uint128" },
    ],
  },
};
