# Lab 18: Fortune Teller dApp

**The problem:** a contract on its own is just code on a chain. A *dApp* is a contract plus an app that talks to it. This lab does both: a fortune-teller contract, and a Node command-line client that calls it over JSON-RPC.
**Your job:** Part 1 writes `src/FortuneTeller.sol`. Part 2 finishes `client/get-fortune.mjs`.

Coming from NEAR? `viewAnswers`, `getFortune` and `viewQuestions` keep their names. The NEAR testnet becomes a local `anvil` chain, and the `fortune.<account>.testnet` sub-account becomes a contract address you put in an environment variable.

## Part 1: the contract

1. **Created with at least 6 answers.** Fewer reverts `NotEnoughAnswers()`, an empty answer reverts `EmptyAnswer()`.
2. **Anyone can read the answers.** `viewAnswers()`.
3. **Asking returns one of the answers and records it.** `getFortune(question)` reverts `EmptyQuestion()` for an empty question. It picks `answers[uint256(keccak256(abi.encode(question, msg.sender, block.prevrandao, questionCount))) % answers.length]`, stores the question, answer and asker, and emits `FortuneTold`.
4. **All past questions can be read.** `viewQuestions()`, oldest first.

This is **not secure randomness**: block producers can influence `block.prevrandao`, and anyone can simulate a call before sending it. That is acceptable for a fortune. See the discussion question.

```bash
forge test               # run all tests
forge test --mt test_US3 # run one story
```

You're done with Part 1 when you see `7 passed; 0 failed`.

## Part 2: the client

`getFortune` returns a value but is a *transaction*, so a plain read would not send it. Your client simulates it first (so a revert such as `EmptyQuestion` is reported before any gas is spent), sends it, waits for the receipt, and prints the answer from the `FortuneTold` event, so what you print is exactly what was stored.

1. In terminal 1, start a local chain: `anvil`. It prints ten funded test accounts. Those private keys are **public**: use them on anvil only, never anywhere real.
2. In terminal 2, deploy (copy account 0's private key from the anvil output):
   ```bash
   forge create src/FortuneTeller.sol:FortuneTeller --rpc-url http://127.0.0.1:8545 --private-key <anvil key 0> --broadcast \
     --constructor-args '["Yes","No","Ask again later","Definitely","Very doubtful","It is certain"]'
   ```
   Put the printed address and the key in your environment:
   ```bash
   export CONTRACT_ADDRESS=<Deployed to address>
   export PRIVATE_KEY=<anvil key 0>
   ```
3. Finish the TODOs in `client/get-fortune.mjs`, then:
   ```bash
   cd client && npm install
   node get-fortune.mjs viewAnswers
   node get-fortune.mjs getFortune "Will I pass Solidity?"
   node get-fortune.mjs viewQuestions
   ```
4. Check yourself: `forge build` in the lab folder, then `cd client && node --test`. The test starts its own anvil on port 8546 and expects `6 passing`: `viewAnswers prints JSON`, `getFortune prints the stored answer`, `viewQuestions includes the question`, `rejects unknown method`, `reports missing CONTRACT_ADDRESS`, `reports EmptyQuestion`.

The client reads `RPC_URL` (default `http://127.0.0.1:8545`), `CONTRACT_ADDRESS` and `PRIVATE_KEY` from the environment. Argument parsing, error decoding and the ABI are given.

## You'll use

JSON-RPC, an ABI written as text, `viem` clients (`createPublicClient`, `createWalletClient`, `readContract`, `simulateContract`, `writeContract`), events and receipts, `anvil` and `forge create`. See the [docs](https://burkifa23.github.io/abc/docs/).

## Discuss

A miner or validator can influence `block.prevrandao`. Who would bother cheating a fortune teller, and what about a lottery?
