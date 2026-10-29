# Lab 07: Sentence Maker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A build project where the whole class writes a sentence one word at a time. It practises strings, bytes, arrays of structs, and rule enforcement.

**Architecture:** `labs/07-sentence-maker/` built with the Lab Recipe (plan 02). The tests follow user stories (`test_US<k>_*`).

**Tech Stack:** Foundry, forge-std, Solidity ^0.8.24.

**Spec:** `docs/superpowers/specs/2026-10-29-abc-learning-platform-design.md`. Recipe: plan 02 § Lab Recipe.

**Adapted from:** NEAR "build a sentence-making smart contract". Its user stories map one-to-one: `init({word})` becomes the constructor, `addWord`, `viewSentence`, `viewWords` (contract account only) becomes owner-only, "no two words in a row" stays, and `Vector` becomes a dynamic array. The NEAR string results become custom errors with the same meaning.

## Global Constraints

- Plan 02 constraints apply.
- The sentence is the words joined by a single space. A word may not contain the space byte `0x20` and may not be empty.
- "Complete" means the last word's last byte is `.`, `?` or `!`.

## Review Focus

1. **A one-word sentence that is already complete** (`"Hi!"` passed to the constructor). The first `addWord` reverts `SentenceComplete`. `test_US5_CompleteFromStart`.
2. **Multi-byte UTF-8 words** (`"Ɛyɛ"`). Allowed, and joined correctly. `test_US3_Utf8Word`.
3. **The deployer adding the second word** right after the constructor word. Reverts `TwoWordsInARow`, because the deployer authored word 1. `test_US6_DeployerCannotFollowSelf`.
4. **Tabs and newlines in a word.** Allowed. Only the space byte is banned. That is a deliberate simplification, and the README says so.

## lab.json

`{ "n": 7, "slug": "sentence-maker", "title": "Sentence Maker", "kind": "build", "summary": "Let the whole class write one sentence, a word at a time, with rules enforced on-chain.", "concepts": ["string and bytes", "struct arrays", "string.concat", "custom errors", "access control"], "adaptedFrom": "NEAR: build a sentence-making smart contract", "docs": ["m03-types/03-bytes-and-literals", "m03-types/08-structs", "m04-units-and-globals/03-abi-encoding-functions"], "openFiles": ["README.md", "src/SentenceMaker.sol"] }`

## Interface (`src/SentenceMaker.sol`)

```solidity
contract SentenceMaker {
    struct Word { address id; string word; }
    error EmptyWord();
    error NoSpacesAllowed();
    error SentenceComplete();
    error TwoWordsInARow();
    error NotOwner();
    event WordAdded(address indexed by, string word);

    address public immutable owner;
    constructor(string memory firstWord);      // validates like addWord; author = msg.sender
    function addWord(string calldata word) external;
    function isComplete() public view returns (bool);
    function viewSentence() external view returns (string memory);
    function viewWords() external view returns (Word[] memory);   // owner only
}
```

## User stories → tests

| # | Story | Tests |
|---|---|---|
| US1 | The contract starts with a first word | `test_US1_InitWord` (`viewSentence()=="Akwaaba"`), `test_US1_InitRejectsSpace` (deploy reverts `NoSpacesAllowed`) |
| US2 | Anyone adds a word, and it is joined with a space | `test_US2_AddWord` ("Akwaaba to" after ama adds "to"; `WordAdded`) |
| US3 | Words have no spaces and aren't empty | `test_US3_NoSpaces`, `test_US3_NoEmpty`, `test_US3_Utf8Word` |
| US4 | A sentence ending in . ? ! is complete | `test_US4_Complete` (`isComplete()` after "Ashesi!") |
| US5 | A complete sentence takes no more words | `test_US5_RejectsAfterComplete`, `test_US5_CompleteFromStart` |
| US6 | No account adds two words in a row | `test_US6_TwoInARow`, `test_US6_DeployerCannotFollowSelf` |
| US7 | Only the owner sees who added each word | `test_US7_ViewWords` (`[{deployer,"Akwaaba"},{ama,"to"}]`), `test_US7_OnlyOwner` |

## Starter

Declarations are given. Storage is the student's choice: the README suggests a `Word[] internal words`. All bodies are TODO. The constructor's TODO says "reuse your validation: write a private function `_validate(string memory)`".

## README

The NEAR user stories, reworded for Solidity, plus the hint "`bytes(word)` lets you look at each byte". **Discuss:** NEAR returned error *strings*. Solidity reverts with custom errors. Which is cheaper, and why do frontends care?

---

### Task A: Tests and solution

- [ ] **Step 1:** Create `labs/07-sentence-maker/foundry.toml` (copied from lab 08) and the test file with every test in the Tests table.
- [ ] **Step 2:** Write the full solution in `src/SentenceMaker.sol` against the Interface above.
- [ ] **Step 3: Run in a Codespace.** `cd labs/07-sentence-maker && forge test`. Expected: `13 passed; 0 failed`.
- [ ] **Step 4:** `mkdir -p .solution/src && cp src/SentenceMaker.sol .solution/src/`
- [ ] **Step 5: Commit.** `git add labs/07-sentence-maker && git commit -m "test(lab-07): tests and reference solution"`

### Task B: Starter, README, metadata

- [ ] **Step 1:** Turn `src/SentenceMaker.sol` into the starter, using the Starter section above. Keep every declaration the tests use.
- [ ] **Step 2:** Write `README.md` and `lab.json` as above, then run `node scripts/sync-labs.mjs`.
- [ ] **Step 3: Verify.** `bash scripts/verify-lab.sh labs/07-sentence-maker`. Expected: `PASS labs/07-sentence-maker`.
- [ ] **Step 4: Commit.** `git add -A labs/07-sentence-maker .devcontainer site/src/labs.json && git commit -m "feat(lab-07): Sentence Maker lab"`

