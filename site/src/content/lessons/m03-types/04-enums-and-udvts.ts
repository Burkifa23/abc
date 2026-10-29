import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "What is the default value of a variable of type `enum Phase { Open, Closed }`?", options: ["`Phase.Closed`", "Whatever the compiler picks", "`Phase.Open`, the first member", "It has no default and reading it reverts"], answer: 2, explain: "Enums default to their first member, which is the number 0." },
  { q: "What happens when you run `Phase(5)` for the two-member enum above?", options: ["It returns `Phase.Closed`", "It reverts with a panic", "It returns 5", "It wraps round to `Phase.Open`"], answer: 1, explain: "Conversion from an integer to an enum is checked, so an out-of-range number reverts." },
  { q: "How does an enum appear in a contract's ABI?", options: ["As a `string`", "As `uint8`", "As `bool`", "As `bytes32`"], answer: 1, explain: "Enums are small unsigned integers; the ABI uses `uint8` for them (with up to 256 members)." },
  { q: "Given `type Kg is uint128;`, which line compiles with no extra definitions?", options: ["`Kg a = 5;`", "`Kg a = Kg.wrap(5);`", "`Kg a = Kg(5);`", "`Kg a = Kg.wrap(5) + Kg.wrap(1);`"], answer: 1, explain: "Values enter a UDVT through `wrap`. There is no implicit conversion from a literal and no `+` unless you define it." },
  { q: "Spot the bug: `Cedis total = a + b;` where `a` and `b` are `Cedis` and the file only has `type Cedis is uint128;`.", options: ["Overflow checking is missing", "A UDVT has no operators until you attach them with `using { add as + } for Cedis global;`", "`Cedis` must be declared `payable`", "It is fine"], answer: 1, explain: "User-defined value types support no operators by default. Define a free function and bind it with `using ... for ... global`." },
  { q: "What is the purpose of `type Cedis is uint128;` over just using `uint128`?", options: ["It saves storage", "It is cheaper to call", "The compiler stops you mixing it with other uint128-based types by accident", "It enables fractional values"], answer: 2, explain: "The storage and gas are the same as `uint128`; the benefit is type safety." },
  { q: "```solidity\nenum Level { Low, Mid, High }\nLevel top = type(Level).max;\n```\nWhat is `top`?", options: ["`Level.Low`", "`Level.Mid`", "`Level.High`", "`3`"], answer: 2, explain: "`type(E).max` is the last member, here `High`. `type(E).min` would be `Low`." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "status-and-price": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// TODO: enum Status { Pending, Approved, Rejected }
// TODO: type Price is uint128;

contract Shop {
    // TODO: public Status variable named status
    // TODO: approve() sets it to Status.Approved
    // TODO: toPrice(uint128) pure returns (Price) using wrap
    // TODO: fromPrice(Price) pure returns (uint128) using unwrap
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

enum Status { Pending, Approved, Rejected }
type Price is uint128;

contract Shop {
    Status public status;

    function approve() public {
        status = Status.Approved;
    }

    function toPrice(uint128 raw) public pure returns (Price) {
        return Price.wrap(raw);
    }

    function fromPrice(Price p) public pure returns (uint128) {
        return Price.unwrap(p);
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "regex", pattern: "enum\\s+Status\\s*\\{[^}]*Approved[^}]*\\}", message: "Declares enum Status with an Approved member" },
      { type: "regex", pattern: "type\\s+Price\\s+is\\s+uint128\\s*;", message: "Declares type Price is uint128" },
      { type: "regex", pattern: "status\\s*=\\s*Status\\.Approved\\s*;", message: "approve() sets status to Status.Approved" },
      { type: "regex", pattern: "Price\\.wrap\\s*\\(", message: "Uses Price.wrap" },
      { type: "regex", pattern: "Price\\.unwrap\\s*\\(", message: "Uses Price.unwrap" },
    ],
  },
};
