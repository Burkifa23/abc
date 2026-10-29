import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "You compute `sha256(\"Ama pays Kofi 5\")` twice on two different laptops. What do you expect?", options: ["Two different hashes", "The same hash both times", "A hash that is shorter on the second laptop", "An error on the second run"], answer: 1, explain: "Hash functions are deterministic: the same input always gives the same output, on any machine." },
  { q: "`sha256(\"Ama pays Kofi 5\")` and `sha256(\"Ama pays Kofi 50\")` differ by one character. How do the hashes compare?", options: ["Almost identical", "Only the last character differs", "Completely different", "The second is exactly twice the first"], answer: 2, explain: "That is the avalanche effect: a tiny change in input scrambles the whole output." },
  { q: "How long is a SHA-256 hash of a one-gigabyte video?", options: ["About one gigabyte", "Half the size of the video", "It depends on how many frames it has", "256 bits (64 hex characters), the same as for a tiny input"], answer: 3, explain: "Hash outputs have a fixed size regardless of input size." },
  { q: "Spot the bug: `// \"I encrypted the password by running sha256(password) so I can decrypt it later.\"` What is wrong?", options: ["SHA-256 is too slow", "A hash is one-way, so it cannot be decrypted", "Hashes are always 32 characters", "Passwords must be stored as plain text"], answer: 1, explain: "Hashing is not encryption. There is no key and no way to reverse a hash back to its input." },
  { q: "In `block2.prev = block1.hash;`, what happens to block2 if someone edits `block1.data` and recomputes only `block1.hash`?", options: ["Nothing, block2 is unaffected", "block2 is deleted automatically", "block2.prev no longer matches block1's new hash", "block1.hash becomes the same as before"], answer: 2, explain: "block2 still stores the old hash of block1, so the mismatch exposes the edit." },
  { q: "Why is a hash of a 4-digit PIN a weak secret?", options: ["Hashes can be reversed with a key", "There are only 10,000 PINs, so an attacker can hash them all and compare", "SHA-256 only accepts long inputs", "Hashes of numbers are always zero"], answer: 1, explain: "One-way does not help when the input space is tiny: guessing and hashing every option is quick." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {};
