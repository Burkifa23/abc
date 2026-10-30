# Lab 19: Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Students learn to ship a contract: a tested Foundry deploy script, a local deploy to `anvil`, and an optional public-testnet deploy using an encrypted keystore. The habits that matter on mainnet are handled safely.

**Architecture:** `labs/19-deploy/` built with the Lab Recipe (plan 02). It adds a `script/` folder. Tests call the deploy script's `run()` directly, so the script logic is tested like any contract.

**Tech Stack:** Foundry (forge script, anvil, cast), forge-std `Script`, Solidity ^0.8.24.

**Spec:** `docs/superpowers/specs/2026-10-29-abc-learning-platform-design.md`. Recipe: plan 02 § Lab Recipe.

**Adapted from:** Solana "learn how to deploy to devnet" and "learn how to build for mainnet". Devnet becomes local anvil, with Sepolia as optional. "Build for mainnet" (keypair safety, program upgrades, cost) becomes keystores, never committing keys, gas estimation, verification, and immutability.

## Global Constraints

- Plan 02 constraints apply. Add `script = "script"` to this lab's `foundry.toml`.
- Never use a raw private key on the command line for a public network. The README uses `cast wallet import abc-deployer --interactive` and `--account abc-deployer`. Anvil's well-known keys are only used on anvil, and the README labels them as public.
- The public-testnet part is optional and not tested. It needs a faucet and an RPC URL that the student provides.

## Review Focus

1. **The `INITIAL_COUNT` env var is missing.** Default to 0 with `vm.envOr`. `test_03_DefaultsWithoutEnv`.
2. **Deploying with an owner of zero.** The script reverts `ZeroOwner` before broadcasting. `test_05_RejectsZeroOwner`.
3. **The script records the deployment** to `deployments/<chainid>.json` so a frontend can find it. `test_06_WritesDeploymentFile` reads it back with `vm.readFile` and `vm.parseJsonAddress`. `foundry.toml` needs `fs_permissions = [{ access = "read-write", path = "./deployments" }]`.
4. **A deployment on chain id 1 (mainnet) without `CONFIRM_MAINNET=yes`.** Refuse with `MainnetNotConfirmed`. `test_07_MainnetGuard` uses `vm.chainId(1)`.

## lab.json

`{ "n": 19, "slug": "deploy", "title": "Deploy", "kind": "learn", "summary": "Write a tested deploy script, ship to a local chain, and learn safe habits for public networks.", "concepts": ["forge script", "vm.envOr", "broadcast", "keystores", "anvil", "cast"], "adaptedFrom": "Solana: deploy to devnet + build for mainnet", "docs": ["m09-under-the-hood/01-using-the-compiler", "m09-under-the-hood/06-metadata"], "openFiles": ["README.md", "script/Deploy.s.sol", "src/Counter.sol"] }`

## Interface

`src/Counter.sol` (complete in the starter, because the lab is about deploying):
```solidity
contract Counter { address public immutable owner; uint256 public count; constructor(address owner_, uint256 initial); function increment() external; }
```
`script/Deploy.s.sol`:
```solidity
contract Deploy is Script {
    error ZeroOwner(); error MainnetNotConfirmed();
    function config() public view returns (address owner, uint256 initial); // OWNER env (default msg.sender), INITIAL_COUNT env (default 0)
    function run() external returns (Counter counter);                      // guards, vm.startBroadcast, new Counter, stop, write file
}
```

## Tests (`test/Deploy.t.sol`)

| Test | Asserts |
|---|---|
| `test_01_RunDeploys` | `run()` returns a contract with code |
| `test_02_ReadsEnv` | `vm.setEnv("INITIAL_COUNT","7")` → `count()==7`; `OWNER` env respected |
| `test_03_DefaultsWithoutEnv` | without the vars → 0 and the default owner |
| `test_04_CounterWorks` | `increment()` after deploy → 1 |
| `test_05_RejectsZeroOwner` | `OWNER=0x000…0` → `ZeroOwner` |
| `test_06_WritesDeploymentFile` | `deployments/31337.json` has `.counter == address(counter)` |
| `test_07_MainnetGuard` | `vm.chainId(1)` → `MainnetNotConfirmed`; with `CONFIRM_MAINNET=yes` it deploys |

Tests clean up the env vars they set in `setUp` with `vm.setEnv(name, "")`, and the script treats `""` as unset.

## Starter

`Counter.sol` is complete. In `Deploy.s.sol`, `config` and `run` have TODO bodies, with comments that name each cheatcode (`vm.envOr`, `vm.startBroadcast`, `vm.serializeAddress`, `vm.writeJson`).

## README

1. `forge test`.
2. `anvil`.
3. `forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast --private-key <anvil key 0>`.
4. `cast call <addr> "count()(uint256)"`.
5. Optional Sepolia, using a keystore and `--account`, with a faucet link.
6. A "mainnet checklist": audits, verification (`forge verify-contract`), immutability, gas, and key custody.

**Discuss:** Solana programs can be upgradeable by default. Ethereum contracts are immutable unless you add a proxy. Which would you want for a land registry, and why?

---

### Task A: Tests and solution

- [ ] **Step 1:** Create `labs/19-deploy/foundry.toml` (copied from lab 08) and the test file with every test in the Tests table.
- [ ] **Step 2:** Write the full solution in `src/Counter.sol` against the Interface above.
- [ ] **Step 3: Run in a Codespace.** `cd labs/19-deploy && forge test`. Expected: `7 passed; 0 failed`.
- [ ] **Step 4:** `mkdir -p .solution/src && cp src/Counter.sol .solution/src/`
- [ ] **Step 5: Commit.** `git add labs/19-deploy && git commit -m "test(lab-19): tests and reference solution"`

### Task B: Starter, README, metadata

- [ ] **Step 1:** Turn `src/Counter.sol` into the starter, using the Starter section above. Keep every declaration the tests use.
- [ ] **Step 2:** Write `README.md` and `lab.json` as above, then run `node scripts/sync-labs.mjs`.
- [ ] **Step 3: Verify.** `bash scripts/verify-lab.sh labs/19-deploy`. Expected: `PASS labs/19-deploy`.
- [ ] **Step 4: Commit.** `git add -A labs/19-deploy .devcontainer site/src/labs.json && git commit -m "feat(lab-19): Deploy lab"`


Note for Tasks A and B: the solution file that differs from the starter is `script/Deploy.s.sol`, not `src/Counter.sol`. In Task A Step 4, copy it to `.solution/script/Deploy.s.sol` instead. In Task B Step 1, starter-ise `script/Deploy.s.sol` and leave `src/Counter.sol` complete.
