import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Which of these can an interface contain?", options: ["A constructor that sets up the first administrator", "A public state variable for the owner", "A modifier named `onlyOwner`", "An event and an external function without a body"], answer: 3, explain: "Interfaces can declare external function signatures, events, errors, structs and enums. Constructors, state variables, modifiers and implementations are all forbidden." },
  { q: "```solidity\nabstract contract Base {\n    function size() public view virtual returns (uint256);\n}\ncontract Leaf is Base {}\n```\nWhat happens?", options: ["It compiles, and size() simply returns zero", "It compiles only after the optimizer is switched on", "It compiles, but calling size() reverts at run time", "It fails: Leaf must implement size() or be abstract"], answer: 3, explain: "A contract that does not implement every inherited function must itself be marked abstract. Only a complete contract can be deployed." },
  { q: "```solidity\ninterface IBank { function pay(address to) external; }\ncontract Bank is IBank {\n    function pay(address to) public { }\n}\n```\nIs the `override` keyword on `pay` required?", options: ["Yes: every function that implements an interface needs it", "No: since 0.8.8 it is optional for interface functions", "Yes, and the function must also be marked virtual", "No, because a public function never overrides anything"], answer: 1, explain: "Interface functions are implicitly virtual, and since 0.8.8 you may implement them without writing `override`. (The function may be widened from external to public.)" },
  { q: "Why must an interface declare every function as `external`?", options: ["Because external functions are cheaper and interfaces must be as cheap as possible", "Because public functions are not allowed to exist in the same file as an interface", "Because an interface only describes the contract as seen from outside, via the ABI", "Because internal functions would need a body, which interfaces cannot have"], answer: 2, explain: "An interface models what the ABI can express: the externally callable surface. Internal and private parts are not part of it." },
  { q: "Spot the bug: `interface IShop { uint256 public price; function buy() external; }`", options: ["An interface cannot declare state variables", "The function buy needs the payable keyword", "Interfaces cannot have more than one member", "`price` must be declared `internal` inside an interface"], answer: 0, explain: "State variables are not allowed in interfaces. Declare a getter function, `function price() external view returns (uint256);`, instead." },
  { q: "You call `IRegistrar(addr).isEnrolled(who, code)`. What does the cast to `IRegistrar` guarantee?", options: ["That the contract at addr was deployed by the university registrar", "That addr really implements every function in IRegistrar, with the behaviour you expect", "Nothing about addr itself: it only fixes how the call is encoded", "That the call can never revert, however the other contract behaves"], answer: 2, explain: "The cast tells the compiler how to encode and decode the call. Whether addr actually contains a matching contract is not checked by the cast." },
  { q: "Two parent interfaces both declare `function free() external view returns (uint256);`. What must a child interface that inherits from both do?", options: ["Nothing: the first parent's declaration is used by the compiler", "Redeclare free() with `override(A, B)`", "Remove one of the parents, since two parents may never share a function", "Mark the interface `abstract` so that the clash is allowed"], answer: 1, explain: "When more than one base defines the same function, the child must name all of them in an override list, including for interfaces." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  vault: {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IVault {
    event Deposited(address indexed who, uint256 amount);
    error Insufficient(uint256 have, uint256 want);

    function deposit() external payable;
    function withdraw(uint256 amount) external;
    function balanceOf(address who) external view returns (uint256);
}

// Hint: a contract that leaves interface functions unimplemented has to be abstract.
// TODO: make Vault a real contract. Keep balances in a mapping, implement all three functions.
// deposit: add msg.value to the sender's balance and emit Deposited.
// withdraw: revert Insufficient(have, amount) if the balance is too small, else subtract and send the Ether.
abstract contract Vault is IVault {
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IVault {
    event Deposited(address indexed who, uint256 amount);
    error Insufficient(uint256 have, uint256 want);

    function deposit() external payable;
    function withdraw(uint256 amount) external;
    function balanceOf(address who) external view returns (uint256);
}

contract Vault is IVault {
    mapping(address => uint256) private balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        uint256 have = balances[msg.sender];
        if (have < amount) revert Insufficient(have, amount);
        balances[msg.sender] = have - amount;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "send failed");
    }

    function balanceOf(address who) external view returns (uint256) {
        return balances[who];
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "regex", pattern: "^\\s*contract\\s+Vault\\s+is\\s+IVault", flags: "m", message: "Vault is a concrete contract that inherits IVault" },
      { type: "abi", contract: "Vault", kind: "function", name: "deposit", inputs: [], stateMutability: "payable", message: "Vault has payable deposit()" },
      { type: "abi", contract: "Vault", kind: "function", name: "withdraw", inputs: ["uint256"], message: "Vault has withdraw(uint256)" },
      { type: "abi", contract: "Vault", kind: "function", name: "balanceOf", inputs: ["address"], outputs: ["uint256"], stateMutability: "view", message: "Vault has view balanceOf(address) returns (uint256)" },
      { type: "regex", pattern: "emit\\s+Deposited\\s*\\(\\s*msg\\.sender\\s*,\\s*msg\\.value\\s*\\)", message: "deposit emits Deposited(msg.sender, msg.value)" },
      { type: "regex", pattern: "revert\\s+Insufficient\\s*\\(", message: "withdraw reverts with Insufficient" },
    ],
  },
};
