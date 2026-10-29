# Course Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write the 83 lessons (10 modules) that teach blockchain foundations and every section of the Solidity v0.8.39 docs, each with MCQs and, where code applies, a browser exercise.

**Architecture:** MDX files in the `lessons` collection from plan 01. Lessons in one module share no state, so module tasks can run in parallel. The coverage table on `/docs/` and `STRICT_COVERAGE=1` prove that all 229 docs sections are covered.

**Tech Stack:** MDX, plus the components from plan 01: `<Quiz>`, `<CodeExercise>`, `<Figure>`, `<HashPlayground>`, `<MiningDemo>`, and the diagrams in `site/src/components/diagrams/`.

**Spec:** `docs/superpowers/specs/2026-10-29-abc-learning-platform-design.md`. Source text: the Solidity docs PDF (v0.8.39, `C:\Users\kwize\OneDrive\Documents\ABC\docs-soliditylang-org-en-latest.pdf`) or https://docs.soliditylang.org/en/latest/

## Global Constraints

- **Depends on plan 01** being merged (collection schema, components, coverage).
- **Own words.** Paraphrase and teach. Never paste paragraphs from the docs. Code samples are short (≤ 25 lines) and adapted, with Ghanaian or campus names where they fit. Each lesson's "Docs sections covered" box links back to the docs.
- **Audience:** Ashesi students who can program a little (Python or JS) and have never used Solidity. Define every term the first time it appears.
- **Every lesson uses this template**, in this order:

```mdx
---
title: "<Title from table>"
summary: "<one sentence: what you can do after this lesson>"
covers: [<exact ids from table>]
labs: [<lab slugs that use this, optional>]
---
import Quiz from "../../../components/Quiz.astro";
import CodeExercise from "../../../components/CodeExercise.astro";
import { quiz, exercises } from "./<NN-slug>";   {/* sidecar <NN-slug>.ts, see below */}

<Hook paragraph: a concrete campus or civic situation the concept solves>

## <Concept section(s)>: explanation, short example, "watch out" callout for the classic mistake

<Figure>…</Figure>            {/* when the table names a diagram */}

## Try it
<CodeExercise id="ex1" {...exercises["ex1"]} />   {/* when the table names an exercise; literal id="…" stays FIRST */}

## Check your understanding
<Quiz questions={quiz} />
```

Sidecar `<NN-slug>.ts` next to each lesson (quiz of ≥ 5: at least 2 "what does this code do", 1 "spot the bug", an `explain` for every question; `exercises` may be `{}`):

```ts
import type { Question } from "../../../lib/quiz";
import type { Check } from "../../../lib/checks";
export const quiz: Question[] = [ /* … */ ];
export const exercises: Record<string, { starter: string; solution: string; checks: Check[] }> = { /* "ex1": { starter: `…`, solution: `…`, checks: [{ type: "compiles" }, …] } */ };
```

- Every lesson passes `bun test src/content/lessons.test.ts` (quiz rules + exercises compiled with solc 0.8.38: starter fails, solution passes, `compiles` check present).
- **Exercises:** the starter compiles, unless the exercise is about fixing a compile error. The starter fails at least one check. The `solution` passes every check with the compiler pinned in plan 01. Checks use exact ABI types (`uint256`, not `uint`).
- **Quiz answers:** spread the correct option's position across A/B/C/D within each lesson. Each `explain` says why the right answer is right.
- **Reading length:** about 8–15 minutes per lesson in m00–m08. m09 lessons may be shorter.

## Review Focus

1. **A lesson whose `covers` lists a depth-2 id but whose text skips some of its depth-3 subsections** (common in Types and Contracts): a reader using the coverage table would land on a lesson that doesn't explain their topic. Step 4 of every module task checks this against the PDF pages.
2. **An exercise solution that only passes because of a warning or an older compiler** (for example `now`, `var`, implicit visibility): it fails in the browser compiler. Step 4 of every module task runs each solution in the real editor.
3. **Quiz questions answerable without the lesson** ("Is Solidity a programming language?"): they test nothing. At least 2 questions per lesson must show code.
4. **Dark mode or a 375px screen with wide code blocks or tables:** the page must not scroll sideways. Step 4 of every module task checks at 375px in dark mode.
5. **Lesson order that uses a concept before it is taught** (for example `mapping` in m02 before m03): add a one-line forward reference ("we cover mappings in Types → Mappings") wherever it happens.

---

### Task 0: Module list

**Files:** Modify `site/src/content/modules.ts`

- [ ] **Step 1:** Set `modules` to these ids and titles, in this order: `m00-foundations` Blockchain Foundations · `m01-smart-contracts` Introduction to Smart Contracts · `m02-source-and-structure` Source Files and Contract Structure · `m03-types` Types · `m04-units-and-globals` Units and Global Variables · `m05-expressions` Expressions and Control Structures · `m06-contracts` Contracts · `m07-by-example` Solidity by Example · `m08-security` Security and Patterns · `m09-under-the-hood` Under the Hood.
- [ ] **Step 2: Verify.** `cd site && bun --bun astro build`. Expected: the build passes.
- [ ] **Step 3: Commit.** `git commit -am "content: module list"`

### Task 1: Module `m00-foundations`: Blockchain Foundations

Adapted from freeCodeCamp web3: "digital ledgers", "proof-of-work", "digital signatures", "proof-of-stake". Concepts only, no Solidity yet. Each lesson has a JS-free interactive or a diagram instead of a code exercise.

**Files:** create `site/src/content/lessons/m00-foundations/<slug>.mdx` for each row. Create diagrams that don't exist yet in `site/src/components/diagrams/`.

| Lesson | Title | `covers` | Exercise (checks) | Diagram |
|---|---|---|---|---|
| `01-the-trust-problem` | The trust problem and digital ledgers | — | — | ChainOfBlocks |
| `02-hashing` | Hash functions | — | — | HashPlayground |
| `03-blocks-and-mining` | Blocks and proof of work | — | — | MiningDemo |
| `04-keys-and-signatures` | Keys, addresses and signatures | — | — | SignatureFlow |
| `05-consensus` | Consensus: proof of work vs proof of stake | — | — | — |
| `06-transactions-and-blocks` | Transactions and blocks on Ethereum | `Introduction to Smart Contracts > Blockchain Basics` | — | TxLifecycle |

- [ ] **Step 1: Write the lessons** in the table, using the lesson template. Each has the exact `covers` listed and at least 5 quiz questions. Exercise rows get one `<CodeExercise>`, whose checks are the ones named in brackets, written as `Check` objects.
- [ ] **Step 2: Write any new diagrams** named in the table, following the diagram pattern from plan 01 Task 5.
- [ ] **Step 3: Verify the build.** `cd site && bun test && bun --bun astro build`. Expected: the build passes, and `/docs/` shows these 6 lessons under "Blockchain Foundations". Every id in this module's `covers` column links to a lesson in the Reference coverage table.
- [ ] **Step 4: Verify in the browser.** `bun --bun astro dev`. For each exercise, the starter fails at least one check, and pasting the `solution` passes all checks. Each quiz scores correctly. At 375px in dark mode, nothing scrolls sideways. For each covered id, open its PDF pages (listed in the coverage table) and confirm every depth-3 heading under it is explained. List those headings in the commit body.
- [ ] **Step 5: Commit.** `git add site && git commit -m "content(m00-foundations): Blockchain Foundations"`

### Task 2: Module `m01-smart-contracts`: Introduction to Smart Contracts

Docs chapters: Getting Started, Installing the Compiler, Introduction to Smart Contracts, Resources. Lesson 01 explains why ABC uses Codespaces + Foundry and Remix, and lists the other install routes from the docs without asking anyone to use them.

**Files:** create `site/src/content/lessons/m01-smart-contracts/<slug>.mdx` for each row. Create diagrams that don't exist yet in `site/src/components/diagrams/`.

| Lesson | Title | `covers` | Exercise (checks) | Diagram |
|---|---|---|---|---|
| `01-getting-started` | Getting started and tooling | `Getting Started`<br>`Translations`<br>`Installing the Solidity Compiler`<br>`Installing the Solidity Compiler > Versioning`<br>`Installing the Solidity Compiler > Remix`<br>`Installing the Solidity Compiler > npm / Node.js`<br>`Installing the Solidity Compiler > Docker`<br>`Installing the Solidity Compiler > Linux Packages`<br>`Installing the Solidity Compiler > macOS Packages`<br>`Installing the Solidity Compiler > Static Binaries`<br>`Installing the Solidity Compiler > Building from Source`<br>`Installing the Solidity Compiler > CMake Options`<br>`Installing the Solidity Compiler > The Version String in Detail`<br>`Installing the Solidity Compiler > Important Information About Versioning`<br>`Resources`<br>`Resources > General Resources`<br>`Resources > Integrated (Ethereum) Development Environments`<br>`Resources > Editor Integrations`<br>`Resources > Solidity Tools`<br>`Resources > Third-Party Solidity Parsers and Grammars` | Compile `contract Hello {}` with an SPDX line and `pragma solidity ^0.8.24;` (compiles) | — |
| `02-simple-storage` | A simple storage contract | `Introduction to Smart Contracts`<br>`Introduction to Smart Contracts > A Simple Smart Contract` | `SimpleStorage`: `set(uint256)`, `get() view returns (uint256)` (abi x2) | — |
| `03-subcurrency` | A subcurrency | `Introduction to Smart Contracts > A Simple Smart Contract` | `Coin`: `mint(address,uint256)`, `send(address,uint256)`, event `Sent(address,address,uint256)`, error `InsufficientBalance(uint256,uint256)` (abi x4) | — |
| `04-the-evm` | The EVM: accounts, transactions, gas | `Introduction to Smart Contracts > The Ethereum Virtual Machine` | — | EvmOverview |
| `05-evm-data-areas` | Storage, transient storage, memory, stack, calldata | `Introduction to Smart Contracts > The Ethereum Virtual Machine` | — | DataLocations |
| `06-message-calls` | Message calls, delegatecall, logs, create, self-destruct, precompiles | `Introduction to Smart Contracts > The Ethereum Virtual Machine` | — | CallVsDelegatecall |

- [ ] **Step 1: Write the lessons** in the table, using the lesson template. Each has the exact `covers` listed and at least 5 quiz questions. Exercise rows get one `<CodeExercise>`, whose checks are the ones named in brackets, written as `Check` objects.
- [ ] **Step 2: Write any new diagrams** named in the table, following the diagram pattern from plan 01 Task 5.
- [ ] **Step 3: Verify the build.** `cd site && bun test && bun --bun astro build`. Expected: the build passes, and `/docs/` shows these 6 lessons under "Introduction to Smart Contracts". Every id in this module's `covers` column links to a lesson in the Reference coverage table.
- [ ] **Step 4: Verify in the browser.** `bun --bun astro dev`. For each exercise, the starter fails at least one check, and pasting the `solution` passes all checks. Each quiz scores correctly. At 375px in dark mode, nothing scrolls sideways. For each covered id, open its PDF pages (listed in the coverage table) and confirm every depth-3 heading under it is explained. List those headings in the commit body.
- [ ] **Step 5: Commit.** `git add site && git commit -m "content(m01-smart-contracts): Introduction to Smart Contracts"`

### Task 3: Module `m02-source-and-structure`: Source Files and Contract Structure

Docs chapters: Layout of a Source File, Import Path Resolution, NatSpec, Structure of a Contract, Style Guide.

**Files:** create `site/src/content/lessons/m02-source-and-structure/<slug>.mdx` for each row. Create diagrams that don't exist yet in `site/src/components/diagrams/`.

| Lesson | Title | `covers` | Exercise (checks) | Diagram |
|---|---|---|---|---|
| `01-license-and-pragmas` | SPDX licenses and pragmas | `Layout of a Solidity Source File`<br>`Layout of a Solidity Source File > SPDX License Identifier`<br>`Layout of a Solidity Source File > Pragmas` | Fix a file missing its SPDX line and version pragma (noWarnings, regex `pragma solidity`) | — |
| `02-imports` | Imports and import path resolution | `Layout of a Solidity Source File`<br>`Layout of a Solidity Source File`<br>`Layout of a Solidity Source File > Importing other Source Files`<br>`Import Path Resolution`<br>`Import Path Resolution > Virtual Filesystem`<br>`Import Path Resolution > Imports`<br>`Import Path Resolution > Base Path and Include Paths`<br>`Import Path Resolution > Allowed Paths`<br>`Import Path Resolution > Import Remapping`<br>`Import Path Resolution > Using URLs in imports` | — | VirtualFilesystem |
| `03-comments-and-natspec` | Comments and NatSpec | `Layout of a Solidity Source File`<br>`Layout of a Solidity Source File > Comments`<br>`NatSpec Format`<br>`NatSpec Format > Documentation Example`<br>`NatSpec Format > Tags`<br>`NatSpec Format > Documentation Output` | Document a function with `@notice`, `@param`, `@return` (regex x3, compiles) | — |
| `04-anatomy-of-a-contract` | Anatomy of a contract | `Structure of a Contract`<br>`Structure of a Contract`<br>`Structure of a Contract > State Variables`<br>`Structure of a Contract > Functions`<br>`Structure of a Contract > Function Modifiers`<br>`Structure of a Contract > Events`<br>`Structure of a Contract > Errors`<br>`Structure of a Contract > Struct Types`<br>`Structure of a Contract > Enum Types` | One of each: state variable, function, modifier, event, error, struct, enum (abi + regex) | ContractAnatomy |
| `05-style-guide` | The style guide | `Style Guide`<br>`Style Guide > Introduction`<br>`Style Guide > Code Layout`<br>`Style Guide > Order of Layout`<br>`Style Guide > Naming Conventions`<br>`Style Guide > NatSpec` | Reorder a messy contract into style-guide order (regex order, noWarnings) | — |

- [ ] **Step 1: Write the lessons** in the table, using the lesson template. Each has the exact `covers` listed and at least 5 quiz questions. Exercise rows get one `<CodeExercise>`, whose checks are the ones named in brackets, written as `Check` objects.
- [ ] **Step 2: Write any new diagrams** named in the table, following the diagram pattern from plan 01 Task 5.
- [ ] **Step 3: Verify the build.** `cd site && bun test && bun --bun astro build`. Expected: the build passes, and `/docs/` shows these 5 lessons under "Source Files and Contract Structure". Every id in this module's `covers` column links to a lesson in the Reference coverage table.
- [ ] **Step 4: Verify in the browser.** `bun --bun astro dev`. For each exercise, the starter fails at least one check, and pasting the `solution` passes all checks. Each quiz scores correctly. At 375px in dark mode, nothing scrolls sideways. For each covered id, open its PDF pages (listed in the coverage table) and confirm every depth-3 heading under it is explained. List those headings in the commit body.
- [ ] **Step 5: Commit.** `git add site && git commit -m "content(m02-source-and-structure): Source Files and Contract Structure"`

### Task 4: Module `m03-types`: Types

Docs chapter: Types. The depth-2 ids are coarse, so several lessons share one id. Each lesson body must still cover all of its depth-3 subsections (see the PDF pages in the coverage table).

**Files:** create `site/src/content/lessons/m03-types/<slug>.mdx` for each row. Create diagrams that don't exist yet in `site/src/components/diagrams/`.

| Lesson | Title | `covers` | Exercise (checks) | Diagram |
|---|---|---|---|---|
| `01-booleans-and-integers` | Booleans, integers and fixed point | `Types`<br>`Types`<br>`Types > Value Types` | `clamp(uint8 x) pure returns (uint8)` (abi pure) | — |
| `02-address-and-contract-types` | Addresses and contract types | `Types`<br>`Types > Value Types` | `balanceOf(address) view returns (uint256)` using `.balance` (abi view, regex) | — |
| `03-bytes-and-literals` | Fixed-size bytes and literals | `Types`<br>`Types > Value Types`<br>`Types > Conversions between Literals and Elementary Types` | `bytes4 constant MAGIC` with hex and unicode literals (compiles, regex) | — |
| `04-enums-and-udvts` | Enums and user-defined value types | `Types`<br>`Types > Value Types` | `enum Status` and `type Price is uint128` with wrap/unwrap (compiles, regex) | — |
| `05-function-types` | Function types | `Types`<br>`Types > Value Types` | Pass an internal function as an argument (compiles, regex) | — |
| `06-data-location` | Data location | `Types`<br>`Types > Reference Types` | Choose `calldata`/`memory`/`storage` correctly in three functions (compiles, noWarnings) | DataLocations |
| `07-arrays-and-slices` | Arrays and array slices | `Types`<br>`Types > Reference Types` | push/pop/length on a dynamic array; calldata slice `data[4:]` (abi, regex) | — |
| `08-structs` | Structs | `Types`<br>`Types > Reference Types` | Struct containing a mapping, held in storage (compiles) | — |
| `09-mappings` | Mappings and iterable mappings | `Types`<br>`Types > Mapping Types` | Nested-mapping getter `allowance(address,address)` (abi) | StorageSlots |
| `10-operators` | Operators | `Types`<br>`Types > Operators`<br>`Cheatsheet`<br>`Cheatsheet > Order of Precedence of Operators` | Ternary, compound assignment, `delete` (regex, compiles) | — |
| `11-conversions` | Type conversions | `Types`<br>`Types > Conversions between Elementary Types`<br>`Types > Conversions between Literals and Elementary Types` | Explicit conversions between uint sizes, bytes and address (compiles, noWarnings) | — |

- [ ] **Step 1: Write the lessons** in the table, using the lesson template. Each has the exact `covers` listed and at least 5 quiz questions. Exercise rows get one `<CodeExercise>`, whose checks are the ones named in brackets, written as `Check` objects.
- [ ] **Step 2: Write any new diagrams** named in the table, following the diagram pattern from plan 01 Task 5.
- [ ] **Step 3: Verify the build.** `cd site && bun test && bun --bun astro build`. Expected: the build passes, and `/docs/` shows these 11 lessons under "Types". Every id in this module's `covers` column links to a lesson in the Reference coverage table.
- [ ] **Step 4: Verify in the browser.** `bun --bun astro dev`. For each exercise, the starter fails at least one check, and pasting the `solution` passes all checks. Each quiz scores correctly. At 375px in dark mode, nothing scrolls sideways. For each covered id, open its PDF pages (listed in the coverage table) and confirm every depth-3 heading under it is explained. List those headings in the commit body.
- [ ] **Step 5: Commit.** `git add site && git commit -m "content(m03-types): Types"`

### Task 5: Module `m04-units-and-globals`: Units and Global Variables

Docs chapters: Units and Globally Available Variables, Cheatsheet.

**Files:** create `site/src/content/lessons/m04-units-and-globals/<slug>.mdx` for each row. Create diagrams that don't exist yet in `site/src/components/diagrams/`.

| Lesson | Title | `covers` | Exercise (checks) | Diagram |
|---|---|---|---|---|
| `01-ether-and-time-units` | Ether and time units | `Units and Globally Available Variables`<br>`Units and Globally Available Variables`<br>`Units and Globally Available Variables > Ether Units`<br>`Units and Globally Available Variables > Time Units` | `FEE = 0.01 ether`, `WINDOW = 7 days` constants (regex) | — |
| `02-block-and-transaction` | Block and transaction properties | `Units and Globally Available Variables`<br>`Units and Globally Available Variables > Special Variables and Functions`<br>`Cheatsheet`<br>`Cheatsheet > Block and Transaction Properties` | Record `msg.sender`, `msg.value`, `block.timestamp` in a payable function (abi payable, regex) | — |
| `03-abi-encoding-functions` | ABI encoding functions and bytes/string members | `Units and Globally Available Variables`<br>`Units and Globally Available Variables > Special Variables and Functions`<br>`Cheatsheet`<br>`Cheatsheet > ABI Encoding and Decoding Functions`<br>`Cheatsheet > Members of bytes and string` | `abi.encode`, `abi.encodePacked`, `abi.encodeCall`, `string.concat` (regex, compiles) | — |
| `04-errors-math-crypto` | Error handling, math and crypto functions | `Units and Globally Available Variables`<br>`Units and Globally Available Variables > Special Variables and Functions`<br>`Cheatsheet`<br>`Cheatsheet > Validations and Assertions`<br>`Cheatsheet > Mathematical and Cryptographic Functions` | `keccak256`, `addmod`, `ecrecover` (compiles, regex) | — |
| `05-address-members-and-type-info` | Address members, contract-related, type information | `Units and Globally Available Variables`<br>`Units and Globally Available Variables > Special Variables and Functions`<br>`Units and Globally Available Variables > Reserved Keywords`<br>`Cheatsheet`<br>`Cheatsheet`<br>`Cheatsheet > Members of address`<br>`Cheatsheet > Contract-related`<br>`Cheatsheet > Type Information`<br>`Cheatsheet > Function Visibility Specifiers`<br>`Cheatsheet > Modifiers` | `type(uint8).max`, `type(I).interfaceId`, `.call{value: x}("")` with return check (regex, noWarnings) | — |

- [ ] **Step 1: Write the lessons** in the table, using the lesson template. Each has the exact `covers` listed and at least 5 quiz questions. Exercise rows get one `<CodeExercise>`, whose checks are the ones named in brackets, written as `Check` objects.
- [ ] **Step 2: Write any new diagrams** named in the table, following the diagram pattern from plan 01 Task 5.
- [ ] **Step 3: Verify the build.** `cd site && bun test && bun --bun astro build`. Expected: the build passes, and `/docs/` shows these 5 lessons under "Units and Global Variables". Every id in this module's `covers` column links to a lesson in the Reference coverage table.
- [ ] **Step 4: Verify in the browser.** `bun --bun astro dev`. For each exercise, the starter fails at least one check, and pasting the `solution` passes all checks. Each quiz scores correctly. At 375px in dark mode, nothing scrolls sideways. For each covered id, open its PDF pages (listed in the coverage table) and confirm every depth-3 heading under it is explained. List those headings in the commit body.
- [ ] **Step 5: Commit.** `git add site && git commit -m "content(m04-units-and-globals): Units and Global Variables"`

### Task 6: Module `m05-expressions`: Expressions and Control Structures

Docs chapter: Expressions and Control Structures.

**Files:** create `site/src/content/lessons/m05-expressions/<slug>.mdx` for each row. Create diagrams that don't exist yet in `site/src/components/diagrams/`.

| Lesson | Title | `covers` | Exercise (checks) | Diagram |
|---|---|---|---|---|
| `01-control-structures` | Control structures | `Expressions and Control Structures`<br>`Expressions and Control Structures`<br>`Expressions and Control Structures > Control Structures` | Loop with `continue` and `break` (compiles, regex) | — |
| `02-function-calls` | Internal, external and named-argument calls | `Expressions and Control Structures`<br>`Expressions and Control Structures > Function Calls` | Call another contract via an interface with `{value: }` and named args (compiles, regex) | — |
| `03-new-and-create2` | Creating contracts with new and create2 | `Expressions and Control Structures`<br>`Expressions and Control Structures > Creating Contracts via new` | Factory using `new Child{salt: s}(arg)` (regex, compiles) | — |
| `04-evaluation-assignment-scoping` | Evaluation order, assignment, destructuring, scoping | `Expressions and Control Structures`<br>`Expressions and Control Structures > Order of Evaluation of Expressions`<br>`Expressions and Control Structures > Assignment`<br>`Expressions and Control Structures > Scoping and Declarations` | Return and destructure two values (compiles, abi outputs) | — |
| `05-checked-unchecked` | Checked and unchecked arithmetic | `Expressions and Control Structures`<br>`Expressions and Control Structures > Checked or Unchecked Arithmetic` | Loop counter in `unchecked { ++i; }` (regex, compiles) | — |
| `06-assert-require-revert` | assert, require and revert | `Expressions and Control Structures`<br>`Expressions and Control Structures > Error handling: Assert, Require, Revert and Exceptions` | `require(cond, CustomError())` and `revert CustomError(x)` (abi error, regex) | — |
| `07-try-catch` | try/catch | `Expressions and Control Structures`<br>`Expressions and Control Structures > Error handling: Assert, Require, Revert and Exceptions` | try an external call; catch `Error`, `Panic`, `bytes` (regex x3, compiles) | — |

- [ ] **Step 1: Write the lessons** in the table, using the lesson template. Each has the exact `covers` listed and at least 5 quiz questions. Exercise rows get one `<CodeExercise>`, whose checks are the ones named in brackets, written as `Check` objects.
- [ ] **Step 2: Write any new diagrams** named in the table, following the diagram pattern from plan 01 Task 5.
- [ ] **Step 3: Verify the build.** `cd site && bun test && bun --bun astro build`. Expected: the build passes, and `/docs/` shows these 7 lessons under "Expressions and Control Structures". Every id in this module's `covers` column links to a lesson in the Reference coverage table.
- [ ] **Step 4: Verify in the browser.** `bun --bun astro dev`. For each exercise, the starter fails at least one check, and pasting the `solution` passes all checks. Each quiz scores correctly. At 375px in dark mode, nothing scrolls sideways. For each covered id, open its PDF pages (listed in the coverage table) and confirm every depth-3 heading under it is explained. List those headings in the commit body.
- [ ] **Step 5: Commit.** `git add site && git commit -m "content(m05-expressions): Expressions and Control Structures"`

### Task 7: Module `m06-contracts`: Contracts

Docs chapter: Contracts (the largest, pp. 118–164).

**Files:** create `site/src/content/lessons/m06-contracts/<slug>.mdx` for each row. Create diagrams that don't exist yet in `site/src/components/diagrams/`.

| Lesson | Title | `covers` | Exercise (checks) | Diagram |
|---|---|---|---|---|
| `01-creating-contracts` | Creating contracts and constructors | `Contracts`<br>`Contracts`<br>`Contracts > Creating Contracts` | Constructor storing `owner` (abi, compiles) | — |
| `02-visibility-and-getters` | Visibility and getters | `Contracts`<br>`Contracts > Visibility and Getters` | Pick public/external/internal/private so the ABI matches (abi presence and absence) | — |
| `03-function-modifiers` | Function modifiers | `Contracts`<br>`Contracts > Function Modifiers` | `onlyOwner` modifier with `_;` (regex, compiles) | — |
| `04-constant-and-immutable` | Constant and immutable | `Contracts`<br>`Contracts > Constant and Immutable State Variables` | Convert config values to constant/immutable (regex, noWarnings) | — |
| `05-transient-storage` | Transient storage and its caveats | `Contracts`<br>`Contracts > Transient Storage`<br>`Contracts > Composability of Smart Contracts and the Caveats of Transient Storage` | Reentrancy lock with `bool transient locked` (regex, compiles) | DataLocations |
| `06-custom-storage-layout` | Custom storage layout | `Contracts`<br>`Contracts > Custom Storage Layout` | `contract C layout at <slot>` (regex, compiles) | — |
| `07-functions-and-mutability` | Parameters, return variables and state mutability | `Contracts`<br>`Contracts > Functions` | Mark three functions `pure`/`view`/non-payable correctly (abi stateMutability x3) | — |
| `08-receive-fallback-overloading` | receive, fallback and overloading | `Contracts`<br>`Contracts > Functions` | `receive()`, `fallback()`, overloaded `f(uint256)`/`f(string)` (abi) | — |
| `09-events` | Events | `Contracts`<br>`Contracts > Events` | Event with three indexed params, emitted (abi event, regex emit) | — |
| `10-custom-errors` | Custom errors | `Contracts`<br>`Contracts > Custom Errors` | Error with params, used in a revert (abi error) | — |
| `11-inheritance` | Inheritance, overriding and constructors | `Contracts`<br>`Contracts > Inheritance` | virtual/override chain with `super` and base constructor args (compiles, regex) | — |
| `12-multiple-inheritance` | Multiple inheritance and linearization | `Contracts`<br>`Contracts > Inheritance` | Diamond `D is B, C` with `override(B, C)` (compiles) | Linearization |
| `13-abstract-and-interfaces` | Abstract contracts and interfaces | `Contracts`<br>`Contracts > Abstract Contracts`<br>`Contracts > Interfaces` | Implement interface `IVault` (abi, compiles) | — |
| `14-libraries` | Libraries | `Contracts`<br>`Contracts > Libraries` | Library of internal functions on `uint256[] storage` (compiles) | — |
| `15-using-for` | using for | `Contracts`<br>`Contracts > Using For` | `using {add as +} for Price global` (regex, compiles) | — |

- [ ] **Step 1: Write the lessons** in the table, using the lesson template. Each has the exact `covers` listed and at least 5 quiz questions. Exercise rows get one `<CodeExercise>`, whose checks are the ones named in brackets, written as `Check` objects.
- [ ] **Step 2: Write any new diagrams** named in the table, following the diagram pattern from plan 01 Task 5.
- [ ] **Step 3: Verify the build.** `cd site && bun test && bun --bun astro build`. Expected: the build passes, and `/docs/` shows these 15 lessons under "Contracts". Every id in this module's `covers` column links to a lesson in the Reference coverage table.
- [ ] **Step 4: Verify in the browser.** `bun --bun astro dev`. For each exercise, the starter fails at least one check, and pasting the `solution` passes all checks. Each quiz scores correctly. At 375px in dark mode, nothing scrolls sideways. For each covered id, open its PDF pages (listed in the coverage table) and confirm every depth-3 heading under it is explained. List those headings in the commit body.
- [ ] **Step 5: Commit.** `git add site && git commit -m "content(m06-contracts): Contracts"`

### Task 8: Module `m07-by-example`: Solidity by Example

Docs chapter: Solidity by Example. Each lesson walks through the docs example in our own words, then points to the lab that builds a civic version (voting → lab 08, blind auction → lab 16, signatures → lab 03).

**Files:** create `site/src/content/lessons/m07-by-example/<slug>.mdx` for each row. Create diagrams that don't exist yet in `site/src/components/diagrams/`.

| Lesson | Title | `covers` | Exercise (checks) | Diagram |
|---|---|---|---|---|
| `01-voting` | Voting with delegation | `Solidity by Example`<br>`Solidity by Example`<br>`Solidity by Example > Voting` | Fill in `delegate(address)` of a Ballot (compiles, abi) | DelegationChain |
| `02-open-auction` | Simple open auction | `Solidity by Example`<br>`Solidity by Example > Blind Auction` | Withdraw pattern `withdraw() returns (bool)` (abi, regex) | — |
| `03-blind-auction` | Blind auction | `Solidity by Example`<br>`Solidity by Example > Blind Auction` | Commit `keccak256(abi.encodePacked(value, fake, secret))` (regex) | CommitReveal |
| `04-safe-remote-purchase` | Safe remote purchase | `Solidity by Example`<br>`Solidity by Example > Safe Remote Purchase` | State modifier `inState(State)` (regex, compiles) | — |
| `05-micropayment-channel` | Micropayment channels and signatures | `Solidity by Example`<br>`Solidity by Example > Micropayment Channel` | `recoverSigner(bytes32,bytes) pure returns (address)` (abi pure) | SignatureFlow |
| `06-modular-contracts` | Modular contracts | `Solidity by Example`<br>`Solidity by Example > Modular Contracts` | Library-backed balances (compiles) | — |

- [ ] **Step 1: Write the lessons** in the table, using the lesson template. Each has the exact `covers` listed and at least 5 quiz questions. Exercise rows get one `<CodeExercise>`, whose checks are the ones named in brackets, written as `Check` objects.
- [ ] **Step 2: Write any new diagrams** named in the table, following the diagram pattern from plan 01 Task 5.
- [ ] **Step 3: Verify the build.** `cd site && bun test && bun --bun astro build`. Expected: the build passes, and `/docs/` shows these 6 lessons under "Solidity by Example". Every id in this module's `covers` column links to a lesson in the Reference coverage table.
- [ ] **Step 4: Verify in the browser.** `bun --bun astro dev`. For each exercise, the starter fails at least one check, and pasting the `solution` passes all checks. Each quiz scores correctly. At 375px in dark mode, nothing scrolls sideways. For each covered id, open its PDF pages (listed in the coverage table) and confirm every depth-3 heading under it is explained. List those headings in the commit body.
- [ ] **Step 5: Commit.** `git add site && git commit -m "content(m07-by-example): Solidity by Example"`

### Task 9: Module `m08-security`: Security and Patterns

Docs chapters: Security Considerations, Common Patterns, Known Bugs, Non-Bugs, SMTChecker. Lesson 09 teaches how to *read* the bug list for a compiler version. It does not list every bug.

**Files:** create `site/src/content/lessons/m08-security/<slug>.mdx` for each row. Create diagrams that don't exist yet in `site/src/components/diagrams/`.

| Lesson | Title | `covers` | Exercise (checks) | Diagram |
|---|---|---|---|---|
| `01-private-data-and-randomness` | Private data and randomness | `Security Considerations`<br>`Security Considerations`<br>`Security Considerations > Pitfalls` | — | — |
| `02-reentrancy` | Reentrancy and checks-effects-interactions | `Security Considerations`<br>`Security Considerations > Pitfalls`<br>`Security Considerations > Recommendations` | Reorder a vulnerable withdraw into CEI order (regex order) | Reentrancy |
| `03-ether-and-gas-pitfalls` | Sending ether, gas limits, loops, call depth | `Security Considerations`<br>`Security Considerations > Pitfalls` | Replace `transfer` with a checked `.call` (regex, noWarnings) | — |
| `04-tx-origin-and-overflows` | tx.origin, proxies, overflows, clearing mappings | `Security Considerations`<br>`Security Considerations > Pitfalls` | Replace `tx.origin` auth with `msg.sender` (regex) | — |
| `05-recommendations` | Recommendations | `Security Considerations`<br>`Security Considerations > Recommendations` | — | — |
| `06-withdrawal-pattern` | Withdrawal from contracts | `Common Patterns`<br>`Common Patterns`<br>`Common Patterns > Withdrawal from Contracts` | Pull payments: `pendingReturns` + `withdraw()` (abi, regex) | — |
| `07-restricting-access` | Restricting access | `Common Patterns`<br>`Common Patterns > Restricting Access` | `onlyBy(address)` and `onlyAfter(uint256)` modifiers (regex) | — |
| `08-state-machine` | State machines | `Common Patterns`<br>`Common Patterns > State Machine` | Stages enum with `atStage` and `timedTransitions` (regex, compiles) | StateMachine |
| `09-known-bugs` | Known bugs and non-bugs | `List of Known Bugs`<br>`Frequently Reported Non-Bugs`<br>`Frequently Reported Non-Bugs > Non-canonical ABI-encoded calldata is accepted`<br>`Frequently Reported Non-Bugs > Different results between the evmasm and the IR pipeline`<br>`Frequently Reported Non-Bugs > Order of evaluation`<br>`Frequently Reported Non-Bugs > Stale references into storage` | — | — |
| `10-smtchecker` | Formal verification with the SMTChecker | `SMTChecker and Formal Verification`<br>`SMTChecker and Formal Verification > Tutorial`<br>`SMTChecker and Formal Verification > SMTChecker Options and Tuning`<br>`SMTChecker and Formal Verification > Abstraction and False Positives`<br>`SMTChecker and Formal Verification > Real World Assumptions` | — | — |

- [ ] **Step 1: Write the lessons** in the table, using the lesson template. Each has the exact `covers` listed and at least 5 quiz questions. Exercise rows get one `<CodeExercise>`, whose checks are the ones named in brackets, written as `Check` objects.
- [ ] **Step 2: Write any new diagrams** named in the table, following the diagram pattern from plan 01 Task 5.
- [ ] **Step 3: Verify the build.** `cd site && bun test && bun --bun astro build`. Expected: the build passes, and `/docs/` shows these 10 lessons under "Security and Patterns". Every id in this module's `covers` column links to a lesson in the Reference coverage table.
- [ ] **Step 4: Verify in the browser.** `bun --bun astro dev`. For each exercise, the starter fails at least one check, and pasting the `solution` passes all checks. Each quiz scores correctly. At 375px in dark mode, nothing scrolls sideways. For each covered id, open its PDF pages (listed in the coverage table) and confirm every depth-3 heading under it is explained. List those headings in the commit body.
- [ ] **Step 5: Commit.** `git add site && git commit -m "content(m08-security): Security and Patterns"`

### Task 10: Module `m09-under-the-hood`: Under the Hood

Docs chapters: Using the Compiler, compiler output, IR codegen, storage/memory/calldata layout, cleanup, source mappings, optimizer, metadata, ABI spec, inline assembly, Yul, grammar, breaking changes, language influences, contributing, brand guide. These are advanced and optional, and they are shorter. Every id must still be covered.

**Files:** create `site/src/content/lessons/m09-under-the-hood/<slug>.mdx` for each row. Create diagrams that don't exist yet in `site/src/components/diagrams/`.

| Lesson | Title | `covers` | Exercise (checks) | Diagram |
|---|---|---|---|---|
| `01-using-the-compiler` | Using the compiler | `Using the Compiler`<br>`Using the Compiler > Using the Commandline Compiler`<br>`Using the Compiler > Setting the EVM Version to Target`<br>`Using the Compiler > Compiler Input and Output JSON Description`<br>`Using the Compiler > Experimental Mode` | — | — |
| `02-compiler-output-and-ir` | Compiler output and the IR pipeline | `Analysing the Compiler Output`<br>`Solidity IR-based Codegen Changes`<br>`Solidity IR-based Codegen Changes > Semantic Only Changes`<br>`Solidity IR-based Codegen Changes > Internals` | — | — |
| `03-storage-layout` | Storage and transient storage layout | `Layout of State Variables in Storage and Transient Storage`<br>`Layout of State Variables in Storage and Transient Storage > Mappings and Dynamic Arrays`<br>`Layout of State Variables in Storage and Transient Storage > JSON Output` | Reorder state variables to pack into fewer slots (regex order) | StorageSlots |
| `04-memory-and-calldata-layout` | Memory, calldata, cleanup, source mappings | `Layout in Memory`<br>`Layout in Memory > Differences to Layout in Storage`<br>`Layout of Call Data`<br>`Cleaning Up Variables`<br>`Source Mappings` | — | MemoryLayout |
| `05-abi-specification` | The contract ABI specification | `Contract ABI Specification`<br>`Contract ABI Specification > Basic Design`<br>`Contract ABI Specification > Function Selector`<br>`Contract ABI Specification > Argument Encoding`<br>`Contract ABI Specification > Types`<br>`Contract ABI Specification > Design Criteria for the Encoding`<br>`Contract ABI Specification > Formal Specification of the Encoding`<br>`Contract ABI Specification > Function Selector and Argument Encoding`<br>`Contract ABI Specification > Examples`<br>`Contract ABI Specification > Use of Dynamic Types`<br>`Contract ABI Specification > Events`<br>`Contract ABI Specification > Errors`<br>`Contract ABI Specification > JSON`<br>`Contract ABI Specification > Strict Encoding Mode`<br>`Contract ABI Specification > Non-standard Packed Mode`<br>`Contract ABI Specification > Encoding of Indexed Event Parameters` | Compute a selector `bytes4(keccak256("transfer(address,uint256)"))` (regex) | AbiEncoding |
| `06-metadata` | Contract metadata | `Contract Metadata`<br>`Contract Metadata > Encoding of the Metadata Hash in the Bytecode`<br>`Contract Metadata > Usage for Automatic Interface Generation and NatSpec`<br>`Contract Metadata > Usage for Source Code Verification` | — | — |
| `07-inline-assembly` | Inline assembly | `Inline Assembly`<br>`Inline Assembly > Example`<br>`Inline Assembly > Access to External Variables, Functions and Libraries`<br>`Inline Assembly > Things to Avoid`<br>`Inline Assembly > Conventions in Solidity`<br>`Inline Assembly > Advanced Safe Use of Memory` | `assembly { r := add(a, b) }` (regex, compiles) | — |
| `08-yul` | Yul | `Yul`<br>`Yul > Motivation and High-level Description`<br>`Yul > Simple Example`<br>`Yul > Stand-Alone Usage`<br>`Yul > Informal Description of Yul`<br>`Yul > Specification of Yul`<br>`Yul > Specification of Yul Object`<br>`Yul > Yul Optimizer`<br>`Yul > Complete ERC20 Example` | — | — |
| `09-optimizer` | The optimizer | `The Optimizer`<br>`The Optimizer > Benefits of Optimizing Solidity Code`<br>`The Optimizer > Differences between Optimized and Non-Optimized Code`<br>`The Optimizer > Optimizer Parameter Runs`<br>`The Optimizer > Opcode-Based Optimizer Module`<br>`The Optimizer > Yul-Based Optimizer Module`<br>`The Optimizer > Codegen-Based Optimizer Module` | — | — |
| `10-grammar` | The language grammar | `Language Grammar` | — | — |
| `11-history` | Breaking changes 0.5 to 0.8 and language influences | `Solidity v0.5.0 Breaking Changes`<br>`Solidity v0.5.0 Breaking Changes > Semantic Only Changes`<br>`Solidity v0.5.0 Breaking Changes > Semantic and Syntactic Changes`<br>`Solidity v0.5.0 Breaking Changes > Explicitness Requirements`<br>`Solidity v0.5.0 Breaking Changes > Deprecated Elements`<br>`Solidity v0.5.0 Breaking Changes > Interoperability With Older Contracts`<br>`Solidity v0.5.0 Breaking Changes > Example`<br>`Solidity v0.6.0 Breaking Changes`<br>`Solidity v0.6.0 Breaking Changes > Changes the Compiler Might not Warn About`<br>`Solidity v0.6.0 Breaking Changes > Explicitness Requirements`<br>`Solidity v0.6.0 Breaking Changes > Semantic and Syntactic Changes`<br>`Solidity v0.6.0 Breaking Changes > New Features`<br>`Solidity v0.6.0 Breaking Changes > Interface Changes`<br>`Solidity v0.6.0 Breaking Changes > How to update your code`<br>`Solidity v0.7.0 Breaking Changes`<br>`Solidity v0.7.0 Breaking Changes > Silent Changes of the Semantics`<br>`Solidity v0.7.0 Breaking Changes > Changes to the Syntax`<br>`Solidity v0.7.0 Breaking Changes > Removal of Unused or Unsafe Features`<br>`Solidity v0.7.0 Breaking Changes > Interface Changes`<br>`Solidity v0.7.0 Breaking Changes > How to update your code`<br>`Solidity v0.8.0 Breaking Changes`<br>`Solidity v0.8.0 Breaking Changes > Silent Changes of the Semantics`<br>`Solidity v0.8.0 Breaking Changes > New Restrictions`<br>`Solidity v0.8.0 Breaking Changes > Interface Changes`<br>`Solidity v0.8.0 Breaking Changes > How to update your code`<br>`Language Influences` | Upgrade a 0.4-style contract to compile on 0.8 (compiles, noWarnings) | — |
| `12-contributing` | Contributing to Solidity and the brand guide | `Contributing`<br>`Contributing > Team Calls`<br>`Contributing > How to Report Issues`<br>`Contributing > Workflow for Pull Requests`<br>`Contributing > AI-Assisted Contributions`<br>`Contributing > Running the Compiler Tests`<br>`Contributing > Running the Fuzzer via AFL`<br>`Contributing > Whiskers`<br>`Contributing > Documentation Style Guide`<br>`Contributing > Solidity Language Design`<br>`Solidity Brand Guide`<br>`Solidity Brand Guide > The Solidity Brand`<br>`Solidity Brand Guide > Solidity Brand Name`<br>`Solidity Brand Guide > Solidity Logo License`<br>`Solidity Brand Guide > Solidity Logo Guidelines`<br>`Solidity Brand Guide > Credits` | — | — |

- [ ] **Step 1: Write the lessons** in the table, using the lesson template. Each has the exact `covers` listed and at least 5 quiz questions. Exercise rows get one `<CodeExercise>`, whose checks are the ones named in brackets, written as `Check` objects.
- [ ] **Step 2: Write any new diagrams** named in the table, following the diagram pattern from plan 01 Task 5.
- [ ] **Step 3: Verify the build.** `cd site && bun test && bun --bun astro build`. Expected: the build passes, and `/docs/` shows these 12 lessons under "Under the Hood". Every id in this module's `covers` column links to a lesson in the Reference coverage table.
- [ ] **Step 4: Verify in the browser.** `bun --bun astro dev`. For each exercise, the starter fails at least one check, and pasting the `solution` passes all checks. Each quiz scores correctly. At 375px in dark mode, nothing scrolls sideways. For each covered id, open its PDF pages (listed in the coverage table) and confirm every depth-3 heading under it is explained. List those headings in the commit body.
- [ ] **Step 5: Commit.** `git add site && git commit -m "content(m09-under-the-hood): Under the Hood"`

### Task 11: Turn on strict coverage

- [ ] **Step 1: Verify locally.** `cd site && STRICT_COVERAGE=1 bun --bun astro build`. Expected: the build passes, with no "Uncovered docs sections" error.
- [ ] **Step 2: Turn it on in CI.** In GitHub, go to repo Settings → Secrets and variables → Actions → Variables, and add `STRICT_COVERAGE` = `1`.
- [ ] **Step 3: Verify the deploy.** Push to `main`. Expected: the Pages workflow passes, and `https://burkifa23.github.io/abc/docs/` shows 229/229 sections covered.
