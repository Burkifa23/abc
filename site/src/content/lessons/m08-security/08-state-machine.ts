import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "What does the ABI show for a public variable of type `enum Stage { Registration, Building, Judging, Closed }`?", options: ["A `string` holding the readable name of the current stage, as spelled in the enum", "A `uint8` holding the stage's position, counting from 0", "A `bool` that is true while the stage is Registration", "A `uint256` holding the time at which the stage began"], answer: 1, explain: "Enums are stored as small integers in order of declaration. `Closed` is 3, and a front end reads it as `uint8`." },
  { q: "Why is `timedTransitions` needed instead of a function that nobody has to call?", options: ["Contracts can read the time only when a function that uses it is public, and a private one cannot read it", "A contract's code runs only when it is called, so it must catch up at the start of each call", "Solidity runs modifiers in the background every second", "The EVM refuses to change a variable unless a timer fires it"], answer: 1, explain: "Nothing on the chain wakes a contract at a deadline. Applying pending transitions at the start of every call makes the stage correct whenever someone interacts with it." },
  { q: "Spot the bug: `function score(address t, uint256 v) external atStage(Stage.Judging) timedTransitions { ... }`", options: ["`atStage` runs first and sees the stale stage, so scoring may be refused wrongly", "`timedTransitions` cannot be used on a function that takes arguments such as an address and a number", "Enum values cannot be passed as modifier arguments at all", "The function must be `payable` for modifiers to change state"], answer: 0, explain: "Modifiers run left to right. The time-based update has to come first, otherwise `atStage` compares against an out-of-date stage." },
  { q: "On day 7 someone calls `submit`, which has `timedTransitions atStage(Stage.Building)`. After the call, what does `stage` read on chain (it was `Building` before the call)?", options: ["`Closed`, because the modifier moved it forward before it failed", "`Registration`, because a failed call resets the contract to the start", "`Building`, because the revert undid the modifier's write as well", "It reads zero, since the call failed to complete properly"], answer: 2, explain: "`atStage` reverts, and a revert undoes all writes in the transaction, including the stage change. A `view` function that recomputes the stage from the timestamps shows the true current stage." },
  { q: "Where in a modifier is a state change visible to the function body?", options: ["Only when it is made after the `_;` statement, once the function body has finished", "Only when the modifier is declared `payable`", "A change before `_;` is visible to the function body that follows", "It is never visible, as modifiers run in a copy of the state"], answer: 2, explain: "Code before `_;` runs first in the same transaction, on the real state. The function body, and any later modifier, sees whatever it wrote." },
  { q: "Which snippet uses a modifier to restrict `closeVoting()` to the Judging stage?", options: ["`function closeVoting() external { Stage.Judging; }`", "`function closeVoting() external atStage(Stage.Judging) { ... }`", "`function closeVoting() external stage == Stage.Judging { ... }`", "`function closeVoting() external { require(Stage.Judging); }`"], answer: 1, explain: "A modifier with the stage as an argument is applied in the function header. The other forms are not valid Solidity or do not test anything." },
];

const head = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Hackathon {
    uint256 public immutable opened = block.timestamp;
    mapping(address => bool) public registered;
    mapping(address => bytes32) public submission;
    mapping(address => uint256) public points;

    error WrongStage();

`;

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  stages: {
    starter: `${head}    // TODO: add enum Stage { Registration, Building, Judging, Closed },
    // a public Stage variable called stage, a modifier atStage(Stage) that reverts
    // WrongStage() unless the stage matches, and a modifier timedTransitions()
    // that moves the stage forward at day 2, day 5 and day 6 after \`opened\`.
    // Then guard each function below; timedTransitions comes first.

    function register() external {
        registered[msg.sender] = true;
    }

    function submit(bytes32 projectHash) external {
        submission[msg.sender] = projectHash;
    }

    function score(address team, uint256 value) external {
        points[team] = value;
    }
}
`,
    solution: `${head}    enum Stage { Registration, Building, Judging, Closed }
    Stage public stage = Stage.Registration;

    modifier atStage(Stage required) {
        if (stage != required) revert WrongStage();
        _;
    }

    modifier timedTransitions() {
        if (stage == Stage.Registration && block.timestamp >= opened + 2 days) {
            stage = Stage.Building;
        }
        if (stage == Stage.Building && block.timestamp >= opened + 5 days) {
            stage = Stage.Judging;
        }
        if (stage == Stage.Judging && block.timestamp >= opened + 6 days) {
            stage = Stage.Closed;
        }
        _;
    }

    function register() external timedTransitions atStage(Stage.Registration) {
        registered[msg.sender] = true;
    }

    function submit(bytes32 projectHash) external timedTransitions atStage(Stage.Building) {
        submission[msg.sender] = projectHash;
    }

    function score(address team, uint256 value) external timedTransitions atStage(Stage.Judging) {
        points[team] = value;
    }
}
`,
    checks: [
      { type: "compiles" },
      { type: "abi", contract: "Hackathon", kind: "function", name: "stage", inputs: [], outputs: ["uint8"], stateMutability: "view", message: "Has a public stage variable of an enum type" },
      { type: "regex", pattern: "enum\\s+Stage\\s*\\{\\s*Registration\\s*,\\s*Building\\s*,\\s*Judging\\s*,\\s*Closed\\s*\\}", message: "Declares enum Stage with the four stages in order" },
      { type: "regex", pattern: "modifier\\s+atStage\\s*\\(\\s*Stage\\s+\\w+\\s*\\)", message: "Declares modifier atStage(Stage)" },
      { type: "regex", pattern: "modifier\\s+timedTransitions\\s*\\(\\s*\\)", message: "Declares modifier timedTransitions()" },
      { type: "regex", pattern: "stage\\s*=\\s*Stage\\.Building[\\s\\S]*stage\\s*=\\s*Stage\\.Judging[\\s\\S]*stage\\s*=\\s*Stage\\.Closed", message: "timedTransitions moves the stage through Building, Judging and Closed" },
      { type: "regex", pattern: "function\\s+register\\s*\\([^)]*\\)[^{]*timedTransitions[^{]*atStage\\s*\\(\\s*Stage\\.Registration\\s*\\)", message: "register: timedTransitions, then atStage(Stage.Registration)" },
      { type: "regex", pattern: "function\\s+submit\\s*\\([^)]*\\)[^{]*timedTransitions[^{]*atStage\\s*\\(\\s*Stage\\.Building\\s*\\)", message: "submit: timedTransitions, then atStage(Stage.Building)" },
      { type: "regex", pattern: "function\\s+score\\s*\\([^)]*\\)[^{]*timedTransitions[^{]*atStage\\s*\\(\\s*Stage\\.Judging\\s*\\)", message: "score: timedTransitions, then atStage(Stage.Judging)" },
    ],
  },
};
