# Lab 04: Video Game Marketplace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The first *build* project. Students write a game shop on their own from user stories: players join for 40 coins, buy items, and sell items back.

**Architecture:** `labs/04-video-game-marketplace/` built with the Lab Recipe (plan 02). Tests are named `test_US<k>_*`, matching README user stories.

**Tech Stack:** Foundry, forge-std, Solidity ^0.8.24.

**Spec:** `docs/superpowers/specs/2026-10-29-abc-learning-platform-design.md`. Recipe: plan 02 § Lab Recipe.

**Adapted from:** freeCodeCamp web3 "build a video game marketplace blockchain". `items.json` becomes constructor arrays, wallets get 40 coins becomes `join()`, `buy-item.js` and `sell-item.js` become `buy` and `sell`, and balance checks via `getAddressBalance` become `coins` checks.

## Global Constraints

- Plan 02 constraints apply.
- The game buys items back at **half** the item price, rounded down.
- Items are named by `string`. Internally they are keyed by `keccak256(bytes(name))`.

## Review Focus

1. **Constructor arrays of different lengths.** Revert `LengthMismatch`. `test_US1_LengthMismatch`.
2. **Selling an item you don't own** (or own zero of). Revert `NotOwned`. `test_US6_CannotSellUnowned`.
3. **An item price of 0 in the constructor.** Revert `ZeroPrice(name)`, because 0 means "unknown item". `test_US1_ZeroPrice`.
4. **Buying with exactly enough coins.** Succeeds, leaving 0. `test_US5_ExactBalance`.

## lab.json

`{ "n": 4, "slug": "video-game-marketplace", "title": "Video Game Marketplace", "kind": "build", "summary": "Build a game shop where players earn coins, buy items and sell them back.", "concepts": ["mapping", "nested mapping", "string keys", "custom errors", "events"], "adaptedFrom": "freeCodeCamp web3: build a video game marketplace blockchain", "docs": ["m03-types/09-mappings", "m06-contracts/10-custom-errors"], "openFiles": ["README.md", "src/GameMarketplace.sol"] }`

## Interface (`src/GameMarketplace.sol`)

```solidity
contract GameMarketplace {
    error LengthMismatch();
    error ZeroPrice(string item);
    error AlreadyJoined();
    error NotJoined();
    error UnknownItem(string item);
    error InsufficientCoins(uint256 needed, uint256 available);
    error NotOwned(string item);
    event Joined(address indexed player);
    event Bought(address indexed player, string item, uint256 price);
    event Sold(address indexed player, string item, uint256 refund);

    uint256 public constant STARTING_COINS = 40;
    mapping(address => uint256) public coins;
    mapping(address => bool) public joined;

    constructor(string[] memory names, uint256[] memory prices);
    function itemCount() external view returns (uint256);
    function itemAt(uint256 i) external view returns (string memory name, uint256 price);
    function priceOf(string calldata item) public view returns (uint256);   // 0 if unknown
    function inventory(address player, string calldata item) external view returns (uint256);
    function join() external;
    function buy(string calldata item) external;   // NotJoined, UnknownItem, InsufficientCoins
    function sell(string calldata item) external;  // NotOwned; refund = price / 2
}
```

## User stories → tests (`test/GameMarketplace.t.sol`)

The shop has items `sword:10, shield:15, potion:5, crown:41`.

| # | Story | Tests |
|---|---|---|
| US1 | The game is created with a list of items and prices | `test_US1_ListsItems` (count 4, `itemAt(1)==("shield",15)`), `test_US1_LengthMismatch`, `test_US1_ZeroPrice` |
| US2 | A player joins once and gets 40 coins | `test_US2_JoinGives40` (event), `test_US2_JoinOnce` |
| US3 | Unknown items have price 0 | `test_US3_UnknownPriceZero` |
| US4 | Buying needs a joined player and a known item | `test_US4_BuyRequiresJoin`, `test_US4_UnknownItem` (reverts `UnknownItem("bow")`) |
| US5 | Buying costs coins and adds to inventory | `test_US5_BuyDeducts` (40→30, inventory 1, `Bought`), `test_US5_InsufficientCoins` (crown: `InsufficientCoins(41, 40)`), `test_US5_ExactBalance` |
| US6 | Selling returns half the price | `test_US6_SellRefundsHalf` (potion: 5→refund 2, `Sold`), `test_US6_CannotSellUnowned` |

## Starter

Signatures, errors, events, and the public state are given. Storage for items is left to the student: the README hints "an array of names plus a mapping from `keccak256(bytes(name))` to price". Every function body is `// TODO`. The constructor must still compile with an empty body.

## README

The problem statement, the user stories as a numbered list (no step-by-step hints), and a "You'll need" list: mapping, nested mapping, `keccak256(bytes(s))`. **Discuss:** freeCodeCamp's version needed miners and signatures for each purchase. What does the EVM give you for free here?

---

### Task A: Tests and solution

- [ ] **Step 1:** Create `labs/04-video-game-marketplace/foundry.toml` (copied from lab 08) and the test file with every test in the Tests table.
- [ ] **Step 2:** Write the full solution in `src/GameMarketplace.sol` against the Interface above.
- [ ] **Step 3: Run in a Codespace.** `cd labs/04-video-game-marketplace && forge test`. Expected: `13 passed; 0 failed`.
- [ ] **Step 4:** `mkdir -p .solution/src && cp src/GameMarketplace.sol .solution/src/`
- [ ] **Step 5: Commit.** `git add labs/04-video-game-marketplace && git commit -m "test(lab-04): tests and reference solution"`

### Task B: Starter, README, metadata

- [ ] **Step 1:** Turn `src/GameMarketplace.sol` into the starter, using the Starter section above. Keep every declaration the tests use.
- [ ] **Step 2:** Write `README.md` and `lab.json` as above, then run `node scripts/sync-labs.mjs`.
- [ ] **Step 3: Verify.** `bash scripts/verify-lab.sh labs/04-video-game-marketplace`. Expected: `PASS labs/04-video-game-marketplace`.
- [ ] **Step 4: Commit.** `git add -A labs/04-video-game-marketplace .devcontainer site/src/labs.json && git commit -m "feat(lab-04): Video Game Marketplace lab"`

