# Lab 09: Fungible Token (ERC-20)

**The problem:** Ashesi wants a campus currency that any wallet or app can understand.
**Your job:** implement the ERC-20 standard from scratch and mint the **Ashesi Campus Token** (`ACT`).

`src/IERC20.sol` is the standard itself (six functions and two events) and is given complete. You write `src/CampusToken.sol`.

## Steps

Run `forge test`: every test fails at first. Fix the TODOs in order. Each test name, such as `test_05_...`, matches a step.

1. **Metadata** (TODO 1). Name "Ashesi Campus Token", symbol "ACT", 18 decimals. `forge test --mt test_01`
2. **The minter.** The deployer is the only account allowed to create new tokens. It is already recorded. `forge test --mt test_02`
3. **Mint** (TODO 3). `totalSupply`, `balanceOf` and `mint`. Minting emits `Transfer` from the zero address. Anyone else reverts `NotMinter()`. `forge test --mt test_03`
4. **Burn** (TODO 4). Destroy your own tokens: lower the balance and the supply, emit `Transfer` to the zero address. Too much reverts `ERC20InsufficientBalance`. `forge test --mt test_04`
5. **Transfer** (TODO 5). Move tokens, emit `Transfer`, return `true`. A transfer of 0 is allowed and still emits. `forge test --mt test_05`
6. **Reject bad transfers** (TODO 6). Too little balance reverts `ERC20InsufficientBalance(sender, balance, needed)`. Sending to the zero address reverts `ERC20InvalidReceiver(address(0))`. `forge test --mt test_06`
7. **Approve** (TODO 7). Let a spender use some of your tokens. `approve` overwrites the old allowance; it does not add to it. The zero address is not a valid spender. `forge test --mt test_07`
8. **Transfer from** (TODO 8). A spender moves tokens on the owner's behalf and the allowance goes down. Too little allowance reverts `ERC20InsufficientAllowance(spender, allowance, needed)`. `forge test --mt test_08`
9. **Infinite allowance** (TODO 9). If the allowance is `type(uint256).max`, do not lower it. Wallets and exchanges rely on this. `forge test --mt test_09`
10. **Fuzzing.** `testFuzz_10_SupplyInvariant` is not one example but hundreds: Foundry feeds it random numbers and checks that the total supply always equals the sum of the balances. If your mint, burn or transfer loses or creates tokens, it will find the case. `forge test --mt testFuzz`

You're done when you see `15 passed; 0 failed`.

```bash
forge test               # run all tests
forge test --mt test_05  # run one step
forge test -vvv          # show why a test failed
```

## Solana versus ERC-20

| Solana token program | ERC-20 |
|---|---|
| Mint account holds the supply | The token contract itself holds `totalSupply` |
| Mint authority | `minter` (or any access control you choose) |
| Each holder has a separate token account | One `balanceOf` mapping inside the contract |
| `mintTo`, `transfer` | `mint`, `transfer` |
| Delegate on a token account | `approve` and `transferFrom` |
| Anyone reads the mint to get supply | `totalSupply()` |

## You'll use

`interface`, `is IERC20`, nested mappings, custom errors with arguments, events, and fuzz tests.

## Discuss

Changing a non-zero allowance with `approve` has a known front-running problem. How could a spender exploit it?
