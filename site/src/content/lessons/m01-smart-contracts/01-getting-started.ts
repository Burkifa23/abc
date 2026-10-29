import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";

export const quiz: Question[] = [
  { q: "You want to try a ten-line contract in two minutes without installing anything. Which tool fits best?", options: ["Building the compiler from source", "A Docker image with a mounted folder", "The Ubuntu PPA", "Remix in the browser"], answer: 3, explain: "Remix runs in a browser tab with no setup, which suits small experiments. The other routes all need installation or extra configuration." },
  { q: "A file starts with `pragma solidity ^0.8.24;`. What does this line do?", options: ["It downloads compiler 0.8.24", "It makes the compiler check that its own version is 0.8.24 or a later 0.8.x, and fail otherwise", "It turns on the newest language features", "It picks a random compatible compiler"], answer: 1, explain: "A pragma only asks the compiler to check its version. It never installs, selects or configures a compiler." },
  { q: "Spot the bug: a student writes `pragma solidity ^0.8.24;` and expects it to compile on Solidity 0.9.0 too. Why will it not?", options: ["The caret was typed wrong", "0.9.0 is lower than 0.8.24", "The caret allows later 0.8.x only, because 0.9.0 may contain breaking changes", "Pragmas only work in Remix"], answer: 2, explain: "For 0.x versions, a change in the second number may break code, so ^0.8.24 stops before 0.9.0." },
  { q: "Which part of `0.8.38+commit.1a2b3c4d.Emscripten.clang` tells you how this binary was built?", options: ["`Emscripten.clang`", "`0.8.38`", "`+`", "Nothing, builds are not recorded"], answer: 0, explain: "The trailing dotted words describe the platform and C++ compiler. The commit part identifies the source, and the first part is the version." },
  { q: "How do the command-line options of `solcjs` relate to those of `solc`?", options: ["They are identical, so tools can swap one for the other", "`solcjs` has more options than `solc`", "They differ, so tools that expect `solc` behaviour will not work with `solcjs`", "`solcjs` only works on macOS"], answer: 2, explain: "solcjs is built from the same source but has fewer features and incompatible command-line options." },
  { q: "A tutorial says `docker run ghcr.io/argotorg/solc:stable --help`. What does the `stable` tag give you?", options: ["The newest unfinished work from the develop branch", "The latest released compiler version", "The oldest version still supported", "A random version"], answer: 1, explain: "`stable` is the latest release. The `nightly` tag is the one that follows the unstable develop branch." },
  { q: "Version 0.8.38 has just been released, and then a breaking change is merged. What version will the next release carry?", options: ["0.8.39", "0.8.38 again", "0.9.0", "1.0.0"], answer: 2, explain: "A breaking change raises the second number. A non-breaking change would have left the planned number as 0.8.39." },
];

export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = {
  "hello-compile": {
    starter: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Hello {
`,
    solution: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Hello {
}
`,
    checks: [
      { type: "compiles" },
      { type: "regex", pattern: "pragma\\s+solidity\\s+\\^0\\.8\\.24\\s*;", message: "Uses pragma solidity ^0.8.24;" },
      { type: "regex", pattern: "contract\\s+Hello\\s*\\{", message: "Declares contract Hello" },
    ],
  },
};
