import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "What happens to a block's hash if one character of its data changes?", options: ["Nothing", "It changes completely", "Only the last digit changes", "The block is deleted"], answer: 1, explain: "Hash functions are sensitive: any change to the input gives a completely different hash." },
  { q: "What does each block store to link it to the chain?", options: ["The hash of the previous block", "The miner's password", "A copy of every earlier block", "The current time only"], answer: 0, explain: "Storing the previous hash means changing an old block breaks every later link." },
  { q: "In `hash(block) < target`, what is mining searching for?", options: ["A new target", "A nonce that makes the hash small enough", "A shorter block", "The previous hash"], answer: 1, explain: "Miners change the nonce until the hash meets the target; that effort is the proof of work." },
  { q: "Why is it hard to rewrite an old block?", options: ["Blocks are encrypted", "Its hash changes, so every later block must be redone", "Nodes forbid editing", "Old blocks are deleted"], answer: 1, explain: "The changed hash invalidates the next block's stored hash, and so on up the chain." },
  { q: "Which line is true? `nonce = nonce + 1;` inside a mining loop", options: ["It verifies a signature", "It tries the next candidate hash", "It lowers the target", "It stores the block"], answer: 1, explain: "Each increment gives a new input to the hash, so a new chance at a valid hash." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {};
