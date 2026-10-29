# Lab 18: Fortune Teller dApp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A build project that crosses the line from contract to app. Students write a fortune-teller contract *and* a Node command-line client that talks to it over JSON-RPC.

**Architecture:** `labs/18-fortune-teller-dapp/` built with the Lab Recipe (plan 02), plus a `client/` folder (Node, `viem`). `lab.json` adds the Node devcontainer feature and an `extraCheck` that runs the client tests against a throwaway `anvil`.

**Tech Stack:** Foundry (forge, anvil), forge-std, Solidity ^0.8.24, Node 22, `viem` (pin to the latest 2.x at implementation time), `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-29-abc-learning-platform-design.md`. Recipe: plan 02 § Lab Recipe. It needs plan 02's `features` and `extraCheck` support.

**Adapted from:** NEAR "build a fortune-telling smart contract", plus the client-side work from NEAR "interact with NEAR programs using the JavaScript API" and Solana "build a client-side app". `viewAnswers`, `getFortune({question})`, `viewQuestions` and `get-fortune.js <method> [arg]` keep their names. The NEAR testnet becomes local `anvil`. The `fortune.<account>.testnet` sub-account becomes a deployed contract address in `client/.env`.

## Global Constraints

- Plan 02 constraints apply.
- At least 6 answers, set in the constructor. An empty answer reverts `EmptyAnswer`, and fewer than 6 reverts `NotEnoughAnswers`.
- `getFortune` picks `answers[uint256(keccak256(abi.encode(question, msg.sender, block.prevrandao, questionCount))) % answers.length]`. The README says plainly that this is *not* secure randomness.
- Client CLI: `node client/get-fortune.mjs <viewAnswers|getFortune|viewQuestions> [question]`. It prints only the result: a JSON array for the views, or the answer string. It reads `RPC_URL`, `CONTRACT_ADDRESS` and `PRIVATE_KEY` from the environment. The default `RPC_URL` is `http://127.0.0.1:8545`.

## Review Focus

1. **`getFortune` returns a value but is a transaction.** The client must use `simulateContract` to read the answer and then `writeContract` and wait for the receipt, or read it from the `FortuneTold` event. The answer printed must equal the stored one. `client.test.mjs: "getFortune prints the stored answer"`.
2. **An unknown method name.** Print `Unknown method: <x>` to stderr and exit 1. `client.test.mjs: "rejects unknown method"`.
3. **`getFortune` without a question.** The contract reverts `EmptyQuestion`, and the client prints the decoded error name and exits 1. `test_US3_EmptyQuestion` plus a client test.
4. **Missing `CONTRACT_ADDRESS`.** A clear message and exit 1, not a stack trace. Client test.

## lab.json

`{ "n": 18, "slug": "fortune-teller-dapp", "title": "Fortune Teller dApp", "kind": "build", "summary": "Build a fortune-telling contract and a Node client that calls it over JSON-RPC.", "concepts": ["JSON-RPC", "viem", "anvil", "ABI", "events", "pseudo-randomness"], "adaptedFrom": "NEAR fortune teller + NEAR/Solana client-side app projects", "docs": ["m09-under-the-hood/05-abi-specification", "m08-security/01-private-data-and-randomness", "m06-contracts/09-events"], "openFiles": ["README.md", "src/FortuneTeller.sol", "client/get-fortune.mjs"], "features": { "ghcr.io/devcontainers/features/node:1": { "version": "22" } }, "extraCheck": "cd client && npm ci && node --test" }`

## Interface (`src/FortuneTeller.sol`)

```solidity
contract FortuneTeller {
    struct Fortune { address asker; string question; string answer; }
    error NotEnoughAnswers(); error EmptyAnswer(); error EmptyQuestion();
    event FortuneTold(address indexed asker, string question, string answer);
    constructor(string[] memory answers_);
    function viewAnswers() external view returns (string[] memory);
    function getFortune(string calldata question) external returns (string memory answer);
    function viewQuestions() external view returns (Fortune[] memory);
}
```

Client files: `client/package.json` (`"type": "module"`, dependency `viem`), `client/get-fortune.mjs` (exports `run(argv, env): Promise<{ code: number, out: string, err: string }>` and calls it when executed directly), and `client/client.test.mjs`. `client.test.mjs` starts `anvil --port 8546` as a child process, deploys from `../out/FortuneTeller.sol/FortuneTeller.json` (bytecode and ABI) with anvil account 0, calls `run` for each method, and kills anvil in `after()`.

## User stories → tests

| # | Story | Tests |
|---|---|---|
| US1 | The fortune teller is created with at least 6 answers | `test_US1_Answers`, `test_US1_TooFew`, `test_US1_EmptyAnswer` |
| US2 | Anyone can read the answers | `test_US2_ViewAnswers` |
| US3 | Asking a question returns one of the answers and records it | `test_US3_GetFortune` (answer ∈ answers, `FortuneTold`, stored), `test_US3_EmptyQuestion` |
| US4 | All past questions and answers can be read | `test_US4_ViewQuestions` (two askers, order kept) |
| US5 | The CLI client calls each method and prints only the result | client tests: `viewAnswers prints JSON`, `getFortune prints the stored answer`, `viewQuestions includes the question`, `rejects unknown method`, `reports missing CONTRACT_ADDRESS`, `reports EmptyQuestion` |

## Starter

The contract has declarations and TODO bodies. `client/get-fortune.mjs` has the argument parsing and env reading done, with TODO blocks for creating the viem clients and for each of the three methods. `client.test.mjs` is complete.

## README

Part 1 is the contract (`forge test`). Part 2 is the client:
1. `anvil` in terminal 1.
2. Deploy with `forge create … --broadcast` in terminal 2, and put the address in the environment.
3. `cd client && npm install && node get-fortune.mjs viewAnswers`.
4. `node --test` to check.

**Discuss:** A miner or validator can influence `block.prevrandao`. Who would bother cheating a fortune teller, and what about a lottery?

---

### Task A: Tests and solution

- [ ] **Step 1:** Create `labs/18-fortune-teller-dapp/foundry.toml` (copied from lab 08) and the test file with every test in the Tests table.
- [ ] **Step 2:** Write the full solution in `src/FortuneTeller.sol` against the Interface above.
- [ ] **Step 3: Run in a Codespace.** `cd labs/18-fortune-teller-dapp && forge test`. Expected: `7 passed; 0 failed`.
- [ ] **Step 4:** `mkdir -p .solution/src && cp src/FortuneTeller.sol .solution/src/`
- [ ] **Step 5: Commit.** `git add labs/18-fortune-teller-dapp && git commit -m "test(lab-18): tests and reference solution"`

### Task B: Starter, README, metadata

- [ ] **Step 1:** Turn `src/FortuneTeller.sol` into the starter, using the Starter section above. Keep every declaration the tests use.
- [ ] **Step 2:** Write `README.md` and `lab.json` as above, then run `node scripts/sync-labs.mjs`.
- [ ] **Step 3: Verify.** `bash scripts/verify-lab.sh labs/18-fortune-teller-dapp`. Expected: `PASS labs/18-fortune-teller-dapp`.
- [ ] **Step 4: Commit.** `git add -A labs/18-fortune-teller-dapp .devcontainer site/src/labs.json && git commit -m "feat(lab-18): Fortune Teller dApp lab"`


Additional steps in this lab (do them in Tasks A and B):
- Task A Step 2b: write the full `client/get-fortune.mjs` and `client/client.test.mjs`, then run `cd client && npm install && forge build --root .. && node --test`. Expected: 6 client tests pass. Copy the client into `.solution/client/get-fortune.mjs`.
- Task B Step 1b: turn `client/get-fortune.mjs` into the starter described above. `verify-lab.sh` then runs `extraCheck` against the solution overlay.
