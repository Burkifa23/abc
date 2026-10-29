import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "Which comment is a NatSpec comment?", options: ["`// weighted score`", "`/* weighted score */`", "`/// weighted score`", "`# weighted score`"], answer: 2, explain: "NatSpec uses a triple slash or a block that opens with two asterisks. The plain `//` and `/* */` forms are ordinary comments the compiler throws away." },
  { q: "A `///` comment above a function has no tags at all, only the text `Adds a student to the roll.` How does the compiler treat it?", options: ["As a `@notice`", "As a `@dev`", "As a syntax error", "As an ordinary comment"], answer: 0, explain: "With no tags, the text is read as if it carried `@notice`, the explanation meant for end users." },
  { q: "Spot the bug: `/// @param amount tokens to send` sits above `function send(address to, uint256 value) public`. What happens?", options: ["Nothing, tags are not checked", "The compiler reports an error because `amount` is not a parameter name", "`amount` becomes an alias for `value`", "The tag is dropped silently but a warning appears"], answer: 1, explain: "A `@param` must be followed by the exact name of a parameter. The compiler rejects documentation that names a parameter which does not exist." },
  { q: "Where does the compiler put the text of `@dev` and `@param` tags in its output?", options: ["In the user documentation (`userdoc`)", "In both files", "In the developer documentation (`devdoc`)", "In the ABI"], answer: 2, explain: "`userdoc` holds end-user messages (`@notice`). `@dev`, `@param`, `@return`, `@author`, `@title` and custom tags go to `devdoc`." },
  { q: "A function returns `(uint256 quotient, uint256 remainder)`. How do you document both results?", options: ["Write one `@return` that mentions both", "Use `@return` twice, once per value, in order", "Use `@param` for each", "You cannot document return values"], answer: 1, explain: "Use one `@return` per returned variable, in the same way as `@param` for inputs. The devdoc then lists them under their names, or as `_0`, `_1` when they are unnamed." },
  { q: "`Base.vote(uint256)` has NatSpec. In `Child`, `vote(uint256)` overrides it and has no comment. When does `Child` still pick up the docs automatically?", options: ["Never, you must always repeat them", "When there is exactly one base function and the parameter names are the same", "Only when the child uses `@inheritdoc Base`", "Always, even with several bases"], answer: 1, explain: "Automatic inheritance works with a single base function and identical parameter names. With several bases or different names, use `@inheritdoc ContractName` to say which one to copy." },
  { q: "You document an `internal` helper with a full set of `@param` tags. What will the NatSpec output contain for it?", options: ["Its tags, like any other function", "A warning", "Nothing: tags are parsed only on external and public items", "Only the `@notice`"], answer: 2, explain: "The compiler only interprets tags for external or public members. Comments on internal and private code are fine for humans but do not appear in the output (this may change in the future)." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "document-weighted": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Course mark calculator
contract Marks {
    // The tags below do not match the function. The compiler rejects them.
    // TODO: make @param and @return match, then fill in the body:
    // the result is score * weight / 100.

    /// @notice Weighted contribution of one assessment
    /// @param mark the raw mark
    /// @param percent the weight in percent
    /// @return the contribution
    /// @return an extra value that does not exist
    function weighted(uint256 score, uint256 weight) public pure returns (uint256) {
        return 0;
    }
}
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Course mark calculator
contract Marks {
    /// @notice Weighted contribution of one assessment
    /// @param score the raw mark
    /// @param weight the weight in percent
    /// @return the contribution
    function weighted(uint256 score, uint256 weight) public pure returns (uint256) {
        return score * weight / 100;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "noWarnings" },
      { type: "abi", contract: "Marks", kind: "function", name: "weighted", inputs: ["uint256", "uint256"], outputs: ["uint256"], stateMutability: "pure", message: "Has pure weighted(uint256,uint256) returning uint256" },
      { type: "regex", pattern: "return\\s+score\\s*\\*\\s*weight\\s*/\\s*100\\s*;", message: "weighted returns score * weight / 100" },
    ],
  },
};
