import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Two miners each find a valid block 1000 at nearly the same moment. What is this called?", options: ["A fork", "A nonce collision", "A slashing event", "A finalised block"], answer: 0, explain: "Two valid blocks competing for the same position create a temporary fork, resolved by the fork-choice rule." },
  { q: "What does this pseudo-code do? `chain = branches.reduce((a, b) => (work(a) >= work(b) ? a : b));`", options: ["Picks the branch with the least work done", "Picks the branch with the most total work", "Mines a new block on both branches at once", "Signs both branches so neither is lost"], answer: 1, explain: "It applies a fork-choice rule: follow the branch with the most proof of work." },
  { q: "In proof of stake, what is a validator's `stake`?", options: ["Their computing power", "The number of nodes they own", "Their number of friends on the network", "Cryptocurrency they lock up as a deposit"], answer: 3, explain: "Stake is the deposit that backs a validator's honesty and can be slashed." },
  { q: "Spot the bug in this claim: \"I control 1,000 nodes, so I control the proof-of-stake network.\"", options: ["Nodes do not exist in proof-of-stake networks", "Weight comes from stake, not from node count", "1,000 is far too few to control anything", "Proof of stake has no validators at all"], answer: 1, explain: "Consensus weight is based on the scarce resource (stake or hash power), not the count of machines." },
  { q: "`validator.sign(blockA); validator.sign(blockB);` where both blocks are at the same height. What can happen to the validator?", options: ["Nothing happens, because signing twice is encouraged", "They are rewarded twice for the extra effort", "Their validator address changes automatically", "They can be slashed for conflicting signatures"], answer: 3, explain: "Signing two conflicting blocks is provable cheating, and part of the deposit can be destroyed." },
  { q: "Which is a real trade-off of proof of work compared with proof of stake?", options: ["It uses far more energy", "It has no fork-choice rule", "It needs no hashing", "Its blocks cannot be signed"], answer: 0, explain: "Proof of work secures the chain by burning computation, which means high energy use." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {};
