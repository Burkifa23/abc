# Lab 01: Hello Foundry

**The problem:** you have never written a smart contract, and nothing tells you if you got it right.
**Your job:** write a greeting contract that only its owner can change. The tests tell you when you are done.

## Step 0: Look around

Open the terminal and run these one at a time.

```bash
pwd              # should end in labs/01-hello-foundry
forge --version  # Foundry is installed for you
forge build      # compiles src/HelloWorld.sol
forge test       # runs the tests: most FAIL right now
```

The list of PASS and FAIL lines is your to-do list. Red means "not done yet", and that is normal.

## Steps

Open `src/HelloWorld.sol`. Each step below matches a `TODO` in the file and a test named `test_0N_...`.

1. **Store the greeting.** The constructor receives `initial`. Save it in the state variable `greeting`. Run `forge test --mt test_01`.
2. **Know the owner.** `owner` is set from `msg.sender`, the account that deployed the contract. It is already written; read it and run `forge test --mt test_02`. This test passes from the start.
3. **Let the owner change it.** In `setGreeting`, save `newGreeting` into `greeting`. Run `forge test --mt test_03`.
4. **Block everyone else.** At the top of `setGreeting`, revert with `NotOwner()` when `msg.sender != owner`. Run `forge test --mt test_04`.
5. **Announce the change.** After saving, `emit GreetingChanged(msg.sender, newGreeting);`. Run `forge test --mt test_05`.
6. **Greet by name.** `greet("Ama")` must return `Akwaaba, Ama!`. Use `string.concat(...)`. Run `forge test --mt test_06`.
7. **Reject empty greetings.** An empty string would leave the contract saying nothing. Revert with `EmptyGreeting()` when `bytes(newGreeting).length == 0`. Run `forge test --mt test_07`.

You're done when you see `7 passed; 0 failed`.

```bash
forge test               # run all tests
forge test --mt test_04  # run one step
forge test -vvv          # show why a test failed
```

## Bonus: deploy it on a local chain

In one terminal start a local blockchain:

```bash
anvil
```

In a second terminal deploy and call your contract. The private key below is anvil's account 0. Anvil's keys are public test keys that everyone knows, so never use them for real money.

```bash
forge create src/HelloWorld.sol:HelloWorld \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast --constructor-args "Akwaaba"

cast call <address from "Deployed to"> "greet(string)(string)" "Ama"
```

## Discuss

Why is `owner` `immutable` and not a normal state variable?
