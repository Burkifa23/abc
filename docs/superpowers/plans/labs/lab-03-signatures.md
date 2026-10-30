# Lab 03: Signatures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Students learn how a private key proves who sent something. They build a coin ledger where anyone can relay a transfer that the owner signed off-chain.

**Architecture:** `labs/03-signatures/` built with the Lab Recipe (plan 02). The tests sign with forge's `vm.sign` and the contract verifies with `ecrecover`.

**Tech Stack:** Foundry, forge-std, Solidity ^0.8.24.

**Spec:** `docs/superpowers/specs/2026-10-29-abc-learning-platform-design.md`. Recipe: plan 02 § Lab Recipe.

**Adapted from:** freeCodeCamp web3 "learn digital signatures by building a wallet". Their `generate-wallet.js` and `ec.sign` become `vm.addr(pk)` and `vm.sign`. A "transaction signed by `Me`" becomes `transferWithSig`. The reward transaction of 40 coins becomes `faucet()`.

## Global Constraints

- Plan 02 constraints apply.
- Signed digest: `toEthSignedMessageHash(transferHash(from, to, amount, nonces[from]))`. `transferHash` includes `address(this)` and `block.chainid` so a signature can't be replayed on another contract or chain.

## Review Focus

1. **Replay:** the same signature submitted twice must fail the second time. `test_08_RejectsReplay`.
2. **A signature for another contract or chain.** It must fail. `test_08b_RejectsOtherChain` uses `vm.chainId(999)`.
3. **A malleable high-`s` signature.** Reject `s > 0x7FFF…5D576E7357A4501DDFE92F46681B20A0`. `test_07b_RejectsHighS`.
4. **`ecrecover` returning `address(0)` for garbage input.** That must never count as a valid signer, even for `from = address(0)`. `test_07c_ZeroSignerRejected`.

## lab.json

`{ "n": 3, "slug": "signatures", "title": "Signatures", "kind": "learn", "summary": "Prove who sent a transfer with a signature, then let anyone relay it.", "concepts": ["ecrecover", "keccak256", "abi.encode", "nonces", "replay protection", "signed messages"], "adaptedFrom": "freeCodeCamp web3: digital signatures by building a wallet", "docs": ["m00-foundations/04-keys-and-signatures", "m04-units-and-globals/04-errors-math-crypto", "m07-by-example/05-micropayment-channel"], "openFiles": ["README.md", "src/SignedCoin.sol"] }`

## Interface (`src/SignedCoin.sol`)

```solidity
contract SignedCoin {
    error AlreadyClaimed();
    error BadSignature();
    error InsufficientBalance(uint256 requested, uint256 available);
    event Transfer(address indexed from, address indexed to, uint256 amount);

    uint256 public constant FAUCET_AMOUNT = 40;
    mapping(address => uint256) public balanceOf;
    mapping(address => uint256) public nonces;
    mapping(address => bool) public claimed;

    function faucet() external;   // once per address; emits Transfer(address(0), msg.sender, 40)
    function transferHash(address from, address to, uint256 amount, uint256 nonce) public view returns (bytes32);
        // keccak256(abi.encode(address(this), block.chainid, from, to, amount, nonce))
    function toEthSignedMessageHash(bytes32 hash) public pure returns (bytes32);
        // keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash))
    function recover(bytes32 digest, uint8 v, bytes32 r, bytes32 s) public pure returns (address);
        // BadSignature if s is high or ecrecover returns address(0)
    function transferWithSig(address from, address to, uint256 amount, uint8 v, bytes32 r, bytes32 s) external;
}
```

## Tests (`test/SignedCoin.t.sol`)

The test uses `(address ama, uint256 amaPk) = makeAddrAndKey("ama")`, plus `kofi` and a relayer `esi`. Helper `_sign(pk, from, to, amt)` returns `(v, r, s)` for the current nonce.

| Test | Asserts |
|---|---|
| `test_01_FaucetGives40` | ama `faucet()` → `balanceOf(ama)==40`, emits Transfer from zero |
| `test_02_FaucetOnce` | second call reverts `AlreadyClaimed` |
| `test_03_TransferHashBindsEverything` | equals `keccak256(abi.encode(address(c), block.chainid, ama, kofi, 5, 0))`, differs if amount changes |
| `test_04_EthSignedHash` | equals manual `keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", h))` |
| `test_05_RecoversSigner` | `vm.sign(amaPk, d)` → `recover(d,v,r,s)==ama` |
| `test_06_RelayedTransfer` | esi relays ama's signed 5 to kofi: balances 35/5, `nonces(ama)==1`, Transfer event |
| `test_07_RejectsWrongSigner` | kofi signs "from ama" → `BadSignature` |
| `test_07b_RejectsHighS` | `s' = n - s`, `v' = v ^ 1` (27↔28) → `BadSignature` |
| `test_07c_ZeroSignerRejected` | `recover(d, 27, 0, 0)` reverts `BadSignature` |
| `test_08_RejectsReplay` | same signature twice → second reverts `BadSignature` |
| `test_08b_RejectsOtherChain` | sign, then `vm.chainId(999)`, relay → `BadSignature` |
| `test_09_RejectsOverspend` | signed 50 with balance 40 → `InsufficientBalance(50, 40)` |

## Starter

Every body is a TODO: faucet (1), transferHash (2), toEthSignedMessageHash (3), recover with the s-range and zero checks (4), transferWithSig (5: recover, compare, nonce++, balances, event; the order is spelled out in the comment).

## README

1. What a keypair is, using `cast wallet new` in the terminal (it prints an address and a private key).
2. Sign with `cast wallet sign`.
3. Then the steps follow the tests.

**Discuss:** Why does the hash include `address(this)` and `block.chainid`? What did freeCodeCamp's JSON chain do instead?

---

### Task A: Tests and solution

- [ ] **Step 1:** Create `labs/03-signatures/foundry.toml` (copied from lab 08) and the test file with every test in the Tests table.
- [ ] **Step 2:** Write the full solution in `src/SignedCoin.sol` against the Interface above.
- [ ] **Step 3: Run in a Codespace.** `cd labs/03-signatures && forge test`. Expected: `12 passed; 0 failed`.
- [ ] **Step 4:** `mkdir -p .solution/src && cp src/SignedCoin.sol .solution/src/`
- [ ] **Step 5: Commit.** `git add labs/03-signatures && git commit -m "test(lab-03): tests and reference solution"`

### Task B: Starter, README, metadata

- [ ] **Step 1:** Turn `src/SignedCoin.sol` into the starter, using the Starter section above. Keep every declaration the tests use.
- [ ] **Step 2:** Write `README.md` and `lab.json` as above, then run `node scripts/sync-labs.mjs`.
- [ ] **Step 3: Verify.** `bash scripts/verify-lab.sh labs/03-signatures`. Expected: `PASS labs/03-signatures`.
- [ ] **Step 4: Commit.** `git add -A labs/03-signatures .devcontainer site/src/labs.json && git commit -m "feat(lab-03): Signatures lab"`

