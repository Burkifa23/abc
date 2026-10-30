# Lab 19: Deploy

**The problem:** a contract nobody can reach is useless, and a careless deploy can cost real money or leak a key. You will write a **tested deploy script**, ship it to a local chain, and learn the habits that keep mainnet deploys safe.
**Your job:** `src/Counter.sol` is given. Write `script/Deploy.s.sol` so that `forge test` is green. The tests call the script's `run()` directly, so the script is tested like any other contract.

The script must:

1. Read `OWNER` (default: the account running the script) and `INITIAL_COUNT` (default 0) from the environment (`config()`).
2. Refuse to deploy with an owner of zero (`ZeroOwner`), before broadcasting anything.
3. Refuse to deploy on chain id 1 (mainnet) unless `CONFIRM_MAINNET=yes` (`MainnetNotConfirmed`).
4. Deploy `Counter` between `vm.startBroadcast()` and `vm.stopBroadcast()`.
5. Write the address to `deployments/<chainid>.json` so a frontend can find it.

Tests are numbered `test_01` to `test_07` and match the list above (01 deploys, 02 and 03 are the environment, 04 the contract, 05 to 07 the guards and the file).

The script reads settings through a small helper, `_env(name)`, and writes through `_outFile()`; both are given. The tests swap them for per-test versions, because environment variables are shared by every test in a run (forge runs tests in parallel) and one test would otherwise leak into another. When you run the script for real, `_env` reads the real environment.

```bash
forge test               # run all tests
forge test --mt test_05  # run one step
forge test -vvv          # show why a test failed
```

You're done with the tests when you see `7 passed; 0 failed`.

## Ship it to a local chain

1. Terminal 1: `anvil`. It prints funded test accounts. **Those private keys are public.** Use them on anvil only.
2. Terminal 2, in this lab folder:
   ```bash
   forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast --private-key <anvil key 0>
   ```
3. Read the result back from the chain: `cast call <address> "count()(uint256)" --rpc-url http://127.0.0.1:8545`. The address is also in `deployments/31337.json`.
4. Try `INITIAL_COUNT=5 forge script ...` and call `count()` again.

## Optional: a public testnet (Sepolia)

This part is not tested and needs a faucet and an RPC URL that you provide (a free provider account works).

Never paste a raw private key on the command line for a public network: it ends up in your shell history. Put it in an encrypted keystore once, then refer to it by name:

```bash
cast wallet import abc-deployer --interactive          # asks for the key, then a password
forge script script/Deploy.s.sol --rpc-url <your Sepolia RPC URL> --account abc-deployer --broadcast
```

Get test ETH from a Sepolia faucet first. Never commit a `.env` file or a key.

## Mainnet checklist

- The code is audited, or at least reviewed by someone who did not write it.
- Tests pass, and you have run the script against a fork or testnet first.
- Estimate the gas (`forge script` without `--broadcast` prints it) and check the price.
- Keys: a hardware wallet or keystore, never a key in the repo or on the command line.
- Verify the source on a block explorer: `forge verify-contract`.
- Contracts are immutable once deployed. Decide before you deploy whether you need a proxy.

## You'll use

`forge script`, `vm.envOr`, `vm.startBroadcast`, `vm.serializeAddress`, `vm.writeJson`, `anvil` and `cast`. See the [docs](https://burkifa23.github.io/abc/docs/).

## Discuss

Solana programs can be upgradeable by default. Ethereum contracts are immutable unless you add a proxy. Which would you want for a land registry, and why?
