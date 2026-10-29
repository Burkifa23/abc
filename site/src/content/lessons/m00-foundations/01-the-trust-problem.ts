import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "The susu club treasurer is the only person holding the notebook. What is the main risk of that setup?", options: ["Nobody is allowed to read the notebook", "Everyone must trust one person's copy", "Members cannot afford GH₵ 20", "The entries are always public"], answer: 1, explain: "A single keeper is a single point of trust: if they err, lie or lose the book, nobody else can check." },
  { q: "What is a 'node' in a blockchain network?", options: ["A computer that keeps a copy of the ledger and talks to its peers", "A single transaction", "The person who owns the most coins", "A password"], answer: 0, explain: "Nodes are the many computers that each hold the ledger. There is no central boss among them." },
  { q: "Look at this block fragment: `{ \"block\": 2, \"prevHash\": \"00a3f9\", \"hash\": \"00c71e\" }`. What does `prevHash` point to?", options: ["The hash of block 3", "The hash of block 2 itself", "The hash of block 1", "The miner's address"], answer: 2, explain: "prevHash stores the hash of the block before it, here block 1, which is what links the chain." },
  { q: "Spot the bug in this claim: \"Once data is on a blockchain, it must be true.\" What is wrong?", options: ["Blockchains never store text", "The chain proves the record is unchanged, not that it was correct when written", "Blocks are deleted after a day", "Only nodes can read the data"], answer: 1, explain: "A ledger preserves what was recorded. It cannot tell whether the original entry was honest or accurate." },
  { q: "Block 1 in `[B1 hash=00a3] <- [B2 prevHash=00a3]` is edited and its hash becomes `7f21`. What does a node notice?", options: ["Nothing, since B2 is a separate block", "B2's prevHash `00a3` no longer matches B1's hash", "B2's hash is now smaller", "B1 is promoted to the end"], answer: 1, explain: "B2 still stores the old fingerprint of B1, so the link breaks and the edit is visible to every node." },
  { q: "Which situation is the best fit for a blockchain over an ordinary database?", options: ["A personal to-do list", "Several organisations who distrust each other need one shared record with no single owner", "A website's image gallery", "A private spreadsheet for one class"], answer: 1, explain: "Blockchains pay off when many parties need a shared, tamper-evident record and no one should control it alone." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {};
