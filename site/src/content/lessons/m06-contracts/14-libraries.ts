import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "A contract calls an `internal` function of a library. What happens at compile time?", options: ["A DELEGATECALL to the deployed library is emitted", "The library function is copied into the calling contract's own code", "A normal CALL to the library address is generated", "The compiler refuses, since libraries only offer external functions"], answer: 1, explain: "Internal library functions are inlined into the contract. No library has to be deployed or linked, and no call is made." },
  { q: "Which EVM operation do `public` and `external` library functions use when your contract calls them?", options: ["DELEGATECALL, so the code runs in your context", "STATICCALL, so the library can never touch state", "CREATE2, to deploy a fresh copy for each call", "SELFDESTRUCT, which hands control to the library"], answer: 0, explain: "A DELEGATECALL runs the library's code with the caller's storage, address and msg.sender." },
  { q: "```solidity\nlibrary L {\n    uint256 public count;\n}\n```\nWhat is wrong with this library?", options: ["Nothing: count is a perfectly normal storage variable", "It should be `internal` rather than `public`", "Libraries are stateless, so they cannot declare state variables at all", "It has to inherit from a contract to hold data"], answer: 2, explain: "Libraries are stateless. They cannot declare state variables, inherit, receive Ether or be destroyed." },
  { q: "```solidity\nlibrary Safe {\n    function bump(uint256[] storage a) external { a.push(1); }\n}\n```\nSomeone sends a plain CALL straight to the deployed `Safe` address, asking for `bump`. What happens?", options: ["It succeeds and increases the library's own array by one entry", "It succeeds but costs more gas than a DELEGATECALL would", "It reverts: the call guard blocks direct calls", "It is ignored, since libraries cannot receive any calls from outside"], answer: 2, explain: "The library compares its own address with the one stored at deployment, and non-view functions revert when they match, which is what happens on a direct CALL." },
  { q: "Which kind of library function can be called directly, without DELEGATECALL, and still succeed?", options: ["Any function marked `payable`", "Only functions that call `selfdestruct` in the end", "Functions marked `view` or `pure`", "Any function that takes a storage pointer"], answer: 2, explain: "The call guard only protects functions that may change state. View and pure functions are safe to run directly." },
  { q: "Spot the bug: a team deploys a contract that calls `public` functions of `library Fees`, straight from compiler output, and the transaction fails.", options: ["Public library functions are not allowed to be called from contracts", "An unlinked placeholder is still in the bytecode", "The contract must inherit from the library first", "Libraries can only be used by contracts deployed in the same transaction"], answer: 1, explain: "The compiler cannot know the library's address, so it leaves a placeholder. It has to be replaced by linking before the bytecode can be deployed." },
  { q: "Why does a call to a `public` library function with a `memory` array copy the array, whereas an `internal` one does not?", options: ["Because a real EVM call must pass the data as bytes", "Because memory arrays are always copied by the optimizer, whatever the call", "Because internal functions can only ever run on storage data", "Because libraries cannot hold references to memory"], answer: 0, explain: "A DELEGATECALL passes encoded arguments, so memory data is copied. Internal calls are plain jumps within the same code, and memory is passed by reference." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "marks-library": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library Marks {
    // Hint: arrays have .length, index access, and .pop().
    // TODO: loop over every entry of self and add them up.
    function total(uint256[] storage self) internal view returns (uint256 sum) {
        sum = 0;
    }

    // TODO: overwrite self[i] with the last element, then pop the last one off.
    function removeAt(uint256[] storage self, uint256 i) internal {
    }
}

contract Gradebook {
    uint256[] public marks;

    function add(uint256 m) external {
        marks.push(m);
    }

    function sumAll() external view returns (uint256) {
        return Marks.total(marks);
    }

    function remove(uint256 i) external {
        Marks.removeAt(marks, i);
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library Marks {
    function total(uint256[] storage self) internal view returns (uint256 sum) {
        for (uint256 i = 0; i < self.length; i++) {
            sum += self[i];
        }
    }

    function removeAt(uint256[] storage self, uint256 i) internal {
        self[i] = self[self.length - 1];
        self.pop();
    }
}

contract Gradebook {
    uint256[] public marks;

    function add(uint256 m) external {
        marks.push(m);
    }

    function sumAll() external view returns (uint256) {
        return Marks.total(marks);
    }

    function remove(uint256 i) external {
        Marks.removeAt(marks, i);
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "regex", pattern: "for\\s*\\([^)]*self\\s*\\.\\s*length", message: "total loops up to self.length" },
      { type: "regex", pattern: "sum\\s*\\+=\\s*self\\s*\\[", message: "total adds each entry to sum" },
      { type: "regex", pattern: "self\\s*\\[\\s*i\\s*\\]\\s*=\\s*self\\s*\\[\\s*self\\s*\\.\\s*length\\s*-\\s*1\\s*\\]", message: "removeAt copies the last element over self[i]" },
      { type: "regex", pattern: "self\\s*\\.\\s*pop\\s*\\(\\s*\\)", message: "removeAt pops the last element" },
      { type: "abi", contract: "Gradebook", kind: "function", name: "sumAll", inputs: [], outputs: ["uint256"], stateMutability: "view", message: "Gradebook has view sumAll()" },
    ],
  },
};
