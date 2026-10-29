import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "A transfer does `balance[ama] -= 5; balance[kofi] += 5;` and the second line fails. What does a transactional database do?", options: ["Keeps Ama's deduction and ignores Kofi", "Cancels the whole transaction so neither balance changes", "Pays Kofi twice later", "Deletes Ama's account"], answer: 1, explain: "Transactions are atomic: they apply completely or not at all." },
  { q: "Two transactions `{ from: ama, to: kofi, value: 100 }` and `{ from: ama, to: esi, value: 100 }` spend the same 100. How does the network resolve this?", options: ["It pays both", "It lets the sender choose", "It picks an order inside a block and rejects whichever comes second", "It cancels Ama's account"], answer: 2, explain: "The block fixes one order for everyone. The conflicting second transaction is rejected." },
  { q: "Where do signed transactions wait before a block proposer includes them?", options: ["In the wallet only", "In the previous block", "On the receiver's phone", "In the mempool"], answer: 3, explain: "Pending transactions sit in the mempool until a proposer picks them." },
  { q: "Spot the bug: `await sendTx(pay); showReceipt(\"Payment complete!\");` What is risky about this?", options: ["Sending is not guaranteed to be included yet, and recent blocks can be reverted", "Receipts must be printed", "sendTx should be synchronous", "Wallets cannot sign"], answer: 0, explain: "A sent transaction may be pending or dropped, so wait for inclusion and further confirmations before treating it as final." },
  { q: "Given `const tx = sign({ to, value, nonce }, privateKey);`, why does the transaction include `nonce`?", options: ["To pick the miner", "To compute the mining reward", "So the same signed transaction cannot be replayed", "To hide the recipient"], answer: 2, explain: "A per-account counter makes each signed transaction usable only once." },
  { q: "You send a transaction. Who decides which block it ends up in?", options: ["You, by setting a block number", "The block proposer, from the pending transactions", "The receiver", "The wallet app"], answer: 1, explain: "Inclusion is up to the proposer, not the sender, so no transaction is guaranteed to be in the next block." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {};
