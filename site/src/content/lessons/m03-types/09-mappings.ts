import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { "q":"What does `votes[someAddress]` return if that address was never written?","options":["It reverts with a Panic for a missing key", "The zero value of the value type", "`null`", "A compile error"], "answer":1,"explain":"Every possible key exists in a mapping and reads as the type's zero value." },
  { "q":"Which type cannot be a mapping key?","options":["`address`","`string`","A struct","An enum"],"answer":2,"explain":"Keys may be value types, bytes, string, contract types, enums and user-defined value types, but not structs, arrays or mappings." },
  { "q":"```solidity\nmapping(address => uint256) balance;\nfunction f() public view returns (uint256) {\n    return balance.length;\n}\n```\nWhat is wrong?","options":["Mappings have no `length` member","Nothing; it returns the number of keys","`view` cannot read a mapping","`balance` must be `public`"],"answer":0,"explain":"A mapping does not record its keys, so it has no length and cannot be iterated." },
  { "q":"```solidity\nmapping(address => mapping(address => uint256)) public allowance;\n```\nWhat is the generated getter's signature?","options":["`allowance(address owner) returns (uint256)`", "`allowance(address,address) returns (uint256)`", "`allowance() returns (mapping(address => uint256))`", "No getter is generated for nested mappings"], "answer":1,"explain":"Each mapping level becomes one parameter of the getter." },
  { "q":"Where is the value for key `k` of a mapping at slot `p` stored?","options":["At slot `p + k`, like a fixed-size array", "At slot `p` itself, with keys stored beside it", "At the slot keccak256(k . p) for key k", "In memory, until the transaction ends"], "answer":2,"explain":"The mapping's own slot stays empty. The value sits at a hash of the key and the slot." },
  { "q":"In the iterable pattern, why store `index + 1` in `position`?","options":["Arrays in Solidity are one-based by design", "So `0` can mean the address is not a member", "To save gas on every write to the mapping", "Because the compiler requires a non-zero value"], "answer":1,"explain":"A mapping returns 0 for a missing key. Starting positions at 1 keeps 0 free as a clear 'absent' marker." },
  { "q":"Spot the bug: `function f(mapping(address => uint256) memory m) public {}`","options":["Mappings cannot be `memory` variables or public parameters","A mapping needs a key name","`public` should be `external`","Nothing; this is valid"],"answer":0,"explain":"Mappings exist only in storage. They are allowed as storage pointers in internal functions, not as memory or public parameters." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "allowance-mapping": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Allowances {
    // TODO: public nested mapping named allowance: owner => spender => amount

    // TODO: let msg.sender set how much spender may use
    function approve(address spender, uint256 amount) external {}
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Allowances {
    mapping(address => mapping(address => uint256)) public allowance;

    function approve(address spender, uint256 amount) external {
        allowance[msg.sender][spender] = amount;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "Allowances", kind: "function", name: "allowance", inputs: ["address", "address"], outputs: ["uint256"], stateMutability: "view", message: "Has a public getter allowance(address,address) returning uint256" },
      { type: "abi", contract: "Allowances", kind: "function", name: "approve", inputs: ["address", "uint256"], stateMutability: "nonpayable", message: "Has approve(address,uint256)" },
      { type: "regex", pattern: "mapping\\s*\\(\\s*address\\s*=>\\s*mapping\\s*\\(\\s*address\\s*=>\\s*uint256\\s*\\)\\s*\\)\\s+public\\s+allowance", message: "allowance is a public nested mapping" },
      { type: "regex", pattern: "allowance\\s*\\[\\s*msg\\.sender\\s*\\]\\s*\\[\\s*spender\\s*\\]\\s*=\\s*amount", message: "approve stores amount under the caller and spender" },
    ],
  },
};
