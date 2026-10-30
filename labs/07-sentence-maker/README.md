# Lab 07: Sentence Maker

**The problem:** the whole class wants to write one sentence together, one word each, and nobody should be able to spoil it.
**Your job:** write `src/SentenceMaker.sol` so that every user story below passes. You decide how to store the words (a `Word[] internal words` works well).

## User stories

Each story matches tests named `test_US<k>_...`.

1. **The contract starts with a first word.** The constructor takes it. `viewSentence()` returns it. A word with a space reverts `NoSpacesAllowed()`.
2. **Anyone adds a word, and it is joined with a space.** After "Akwaaba" and "to", the sentence is `Akwaaba to`. `addWord` emits `WordAdded`.
3. **Words have no spaces and are not empty.** Revert `NoSpacesAllowed()` or `EmptyWord()`. Words with non-ASCII letters, such as `Ɛyɛ`, are fine. Only the space byte (`0x20`) is banned. Tabs and newlines are allowed; that is a deliberate simplification.
4. **A sentence ending in `.`, `?` or `!` is complete.** `isComplete()` checks the last byte of the last word.
5. **A complete sentence takes no more words.** Revert `SentenceComplete()`. This includes a sentence that was complete from the start, like `"Hi!"`.
6. **No account adds two words in a row.** Revert `TwoWordsInARow()`. The deployer wrote the first word, so the deployer cannot add the second.
7. **Only the owner sees who added each word.** `viewWords()` returns each word with its author, and reverts `NotOwner()` for anyone else.

```bash
forge test               # run all tests
forge test --mt test_US6 # run one story
forge test -vvv          # show why a test failed
```

You're done when you see `13 passed; 0 failed`.

## You'll need

- `bytes(word)` lets you look at each byte of a string
- `string.concat(a, " ", b)` joins strings
- a `struct` array to remember who wrote each word
- a private helper such as `_validate(string memory)` used by both the constructor and `addWord`

## Discuss

NEAR returned error strings. Solidity reverts with custom errors. Which is cheaper, and why do frontends care?
