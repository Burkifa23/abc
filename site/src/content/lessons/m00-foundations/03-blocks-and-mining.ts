import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "What is the nonce used for in a mining loop?", options: ["It stores the miner's name", "It is a field the miner changes to get a different hash", "It is the previous block's hash", "It decides the transaction fees"], answer: 1, explain: "The nonce carries no other meaning, so miners change it just to produce new candidate hashes." },
  { q: "What does this loop do? `while (sha256(header + nonce) >= target) { nonce = nonce + 1; }`", options: ["Verifies a signature", "Lowers the target each time", "Stores the block", "Keeps trying nonces until the hash is below the target"], answer: 3, explain: "It increments the nonce until the hash meets the target. That effort is the proof of work." },
  { q: "A valid hash must start with four zeros. Which of these is valid: `00c71e90`, `a0000bc4`, `0000a1c3`?", options: ["00c71e90", "a0000bc4", "0000a1c3", "None of them"], answer: 2, explain: "Only 0000a1c3 starts with four zeros. The others have fewer leading zeros or the zeros come later." },
  { q: "Spot the bug in this claim: \"The first miner to find the nonce did the cleverest maths.\"", options: ["Nonces are always found instantly", "There is no clever maths: the miner just tried guesses, with some luck", "Miners never use computers", "The target is always zero"], answer: 1, explain: "Hashes behave randomly, so the only way to find a valid one is brute force." },
  { q: "Why is checking a mined block cheap even though mining it was expensive?", options: ["A verifier hashes the header once and compares it to the target", "Verifiers use a faster computer", "Verifiers skip the previous hash", "Mining is secretly fake"], answer: 0, explain: "Proof of work is hard to produce but takes one hash to verify." },
  { q: "An attacker edits a transaction in block 2 of a 100-block chain. Given `block3.prevHash = block2.hash`, what must they redo?", options: ["Only block 2's work", "Blocks 2 through 100", "Only block 100's work", "Nothing, block 3 does not care"], answer: 1, explain: "Changing block 2's hash invalidates block 3's prevHash, and so on, so every later block's work must be repeated." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {};
