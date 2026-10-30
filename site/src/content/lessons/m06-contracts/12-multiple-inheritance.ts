import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "For `contract D is B, C`, where B and C both derive from A, what is the linear order that Solidity uses, most derived first?", options: ["D, B, C, A", "D, C, B, A", "A, B, C, D", "D, A, B, C"], answer: 1, explain: "Parents are listed from most base-like to most derived, so C is searched before B, and the shared ancestor A comes last." },
  { q: "```solidity\ncontract A { function f() public virtual {} }\ncontract B is A { function f() public virtual override {} }\ncontract C is A { function f() public virtual override {} }\ncontract D is B, C {}\n```\nWhat happens?", options: ["It compiles, and C's version wins because it is last", "It compiles, and the first parent in the list wins", "It fails: D must override f and name both B and C", "It fails: a diamond is never allowed in Solidity"], answer: 2, explain: "B and C both override f and neither overrides the other, so D has to say `override(B, C)`. Diamonds themselves are fine." },
  { q: "Inside contract C of the line D, C, B, A, what does `super.f()` call?", options: ["A.f() directly, because A is the original definition", "The f() of C's own parents in the order they are written", "Nothing: super only works in the constructor", "B.f(), the next contract along the final line"], answer: 3, explain: "`super` means the next implementation in the linear order of the contract that is actually deployed, not simply a parent of the one being written." },
  { q: "Spot the bug: `contract Base {} contract Mid is Base {} contract Top is Mid, Base {}`", options: ["The linearization is impossible: Mid is listed before Base although Mid inherits from Base", "Nothing is wrong: listing all ancestors is encouraged", "Top needs the keyword `virtual` in front of its name", "Top must be turned into an interface before it can have two parents"], answer: 0, explain: "The list order claims Base is more derived than Mid, while Mid derives from Base. Writing `is Base, Mid` fixes it." },
  { q: "A diamond's top contract A has a function that adds one entry to a log. B and C override it, each calling `super.f()` after adding its own entry. D overrides it too, also calling super. How many times does A's entry appear after one call to D.f()?", options: ["Twice, once through B and once through C", "Zero times, because super skips the original definition", "Once, because each contract appears once in the line", "It depends on the gas price of the transaction"], answer: 2, explain: "Because the line contains A only once, the chain D, C, B, A runs A's code once. Naming A.f() from both sides would run it twice." },
  { q: "```solidity\ncontract A { function f() public pure virtual returns (uint256) { return 1; } }\ncontract B is A {}\ncontract C is A {}\ncontract D is B, C {}\n```\nDoes D need an `override` clause for f?", options: ["Yes, always: any diamond needs override(B, C)", "No: only A defines f, so there is a single definition to inherit", "Yes, but only if D also adds a constructor", "No, but only because f is pure"], answer: 1, explain: "Neither B nor C changes f, so every path leads to the same one definition in A. There is nothing ambiguous to resolve." },
  { q: "Which statement about constructors in `contract D is B, C` is right?", options: ["They run in the linear order, starting from the most base-like contract", "They run in the order the arguments are written in D's constructor header", "Only D's constructor runs; base constructors are never executed", "They run in a random order fixed at deployment time"], answer: 0, explain: "Constructor order always follows the linearization, no matter in which order the base arguments are written." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  diamond: {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Registry {
    string[] public trail;

    function enroll() public virtual {
        trail.push("Registry");
    }
}

contract Hostel is Registry {
    function enroll() public virtual override {
        trail.push("Hostel");
        super.enroll();
    }
}

contract Library is Registry {
    function enroll() public virtual override {
        trail.push("Library");
        super.enroll();
    }
}

// Hint: two parents define enroll, so Both must name them: override(X, Y).
// TODO: add enroll() to Both. Push "Both" onto trail, then call super.enroll().
contract Both is Hostel, Library {
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Registry {
    string[] public trail;

    function enroll() public virtual {
        trail.push("Registry");
    }
}

contract Hostel is Registry {
    function enroll() public virtual override {
        trail.push("Hostel");
        super.enroll();
    }
}

contract Library is Registry {
    function enroll() public virtual override {
        trail.push("Library");
        super.enroll();
    }
}

contract Both is Hostel, Library {
    function enroll() public override(Hostel, Library) {
        trail.push("Both");
        super.enroll();
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "regex", pattern: "override\\s*\\(\\s*Hostel\\s*,\\s*Library\\s*\\)", message: "Both overrides enroll with override(Hostel, Library)" },
      { type: "regex", pattern: "trail\\s*\\.\\s*push\\s*\\(\\s*\"Both\"\\s*\\)", message: "Both pushes its own step onto trail" },
      { type: "regex", pattern: "super\\s*\\.\\s*enroll\\s*\\(\\s*\\)", message: "Both continues the chain with super.enroll()" },
      { type: "abi", contract: "Both", kind: "function", name: "enroll", inputs: [], message: "Both exposes enroll()" },
    ],
  },
};
