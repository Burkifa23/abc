import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

const make = (debitBody: string) => `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library CreditBook {
    struct Ledger {
        mapping(address => uint256) funds;
        uint256 total;
    }

    error Insufficient(uint256 available, uint256 needed);

    function credit(Ledger storage book, address who, uint256 amount) internal {
        book.funds[who] += amount;
        book.total += amount;
    }

${debitBody}

    function balanceOf(Ledger storage book, address who) internal view returns (uint256) {
        return book.funds[who];
    }
}

contract Canteen {
    using CreditBook for CreditBook.Ledger;

    CreditBook.Ledger private book;

    function topUp() external payable {
        book.credit(msg.sender, msg.value);
    }

    function spend(uint256 amount) external {
        book.debit(msg.sender, amount);
    }

    function balanceOf(address student) external view returns (uint256) {
        return book.balanceOf(student);
    }

    function totalCredit() external view returns (uint256) {
        return book.total;
    }
}
`;

export const quiz: Question[] = [
  { q: "Why does every function in `CreditBook` take a `Ledger storage` parameter?", options: ["Libraries are not allowed to declare return values of their own at all", "It makes the library cheaper to deploy than an ordinary contract", "A `memory` argument is limited to a few hundred bytes in total size here", "The ledger has a mapping, so only a storage pointer edits real data"], answer: 3, explain: "A struct containing a mapping cannot be copied into memory. A storage pointer refers to the caller's actual data, so the library edits it in place." },
  { q: "What happens to an `internal` library function when a contract uses it?", options: ["It is compiled into the contract, as if the code were written there", "It is called through `delegatecall` on a separately deployed copy of the library", "It is copied onto the blockchain only after the first student calls it", "It is compiled into a second contract that must be linked at deployment"], answer: 0, explain: "Internal library functions are inlined into the calling contract, so there is no separate deployment, no linking and no extra external call." },
  { q: "Which statement about a library with `public` functions is correct?", options: ["It keeps state variables of its own, shared by every contract that calls into it", "It can inherit from other libraries and can itself be inherited from by contracts", "It is deployed and linked, and runs on the caller's storage via `delegatecall`", "It is reached with an ordinary external call, so it uses its own storage"], answer: 2, explain: "Public library functions live in a deployed library contract. The calling contract uses delegatecall, so the library's code operates on the caller's storage; the library has no storage of its own." },
  { q: "Spot the bug: `function debit(Ledger memory book, address who, uint256 amount) internal { book.funds[who] -= amount; }`", options: ["`-=` cannot be used on a mapping value inside any library function", "A mapping struct cannot be a memory parameter, and copies never save", "`internal` library functions cannot take struct arguments of any kind at all", "The function has to be `payable` before it is allowed to change balances"], answer: 1, explain: "Mappings exist only in storage, so a struct containing one cannot be a `memory` parameter, and a memory copy could never update the caller's real balances." },
  { q: "What does `using CreditBook for CreditBook.Ledger;` let you write?", options: ["`CreditBook.deploy()` to create a fresh library instance for the ledger", "`new CreditBook.Ledger()` to build a brand new ledger in memory", "`book.debit()` with no arguments at all, as the ledger is implied", "`book.debit(who, amount)`, i.e. `CreditBook.debit(book, who, amount)`"], answer: 3, explain: "`using for` attaches the library's functions to the type. The value before the dot is passed as the first argument." },
  { q: "`Canteen` and `Bookshop` each declare `CreditBook.Ledger private book;` and use the library. What do they share?", options: ["The same balances, because the library is the place where data is kept", "One storage slot, so the total credit is common to both of these contracts", "Only the logic; each contract keeps its own ledger in its own storage slots", "Nothing, as two contracts are not able to use a single library together"], answer: 2, explain: "A library shares behaviour, not data. Each ledger lives in the storage of the contract that declared it." },
  { q: "In `debit`, why is the balance read into `have` and compared before subtracting?", options: ["The error can show the real balance, and nothing has been changed yet", "The compiler rejects any direct subtraction on mapping values stored in a struct", "It avoids paying gas for the subtraction in most of the possible cases", "A `revert` statement is only allowed to mention local variables, never storage"], answer: 0, explain: "Checking first and reverting with `Insufficient(have, amount)` gives a useful reason and leaves state untouched. Checked arithmetic would also revert on underflow, but with an unhelpful panic." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "library-balances": {
    starter: make(`    // TODO: if the student holds less than \`amount\`, revert Insufficient(have, amount).
    // Otherwise reduce both their balance and the running total.
    function debit(Ledger storage book, address who, uint256 amount) internal {
    }`),
    solution: make(`    function debit(Ledger storage book, address who, uint256 amount) internal {
        uint256 have = book.funds[who];
        if (have < amount) revert Insufficient(have, amount);
        book.funds[who] = have - amount;
        book.total -= amount;
    }`),
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "Canteen", kind: "function", name: "spend", inputs: ["uint256"], outputs: [], stateMutability: "nonpayable", message: "Canteen has spend(uint256)" },
      { type: "regex", pattern: "using\\s+CreditBook\\s+for\\s+CreditBook\\.Ledger", message: "Canteen attaches the library with using ... for" },
      { type: "regex", pattern: "revert\\s+Insufficient\\s*\\(", message: "Reverts with Insufficient when the balance is too low" },
      { type: "regex", pattern: "funds\\s*\\[\\s*\\w+\\s*\\]\\s*(-=|=)", message: "Updates the student's balance" },
      { type: "regex", pattern: "\\btotal\\s*-=", message: "Reduces the running total" },
    ],
  },
};
