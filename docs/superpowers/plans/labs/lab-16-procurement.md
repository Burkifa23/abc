# Lab 16: Transparent Public Procurement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `Plan.md` Workshop 5. A government tender where suppliers submit **sealed** bids and the agency's budget sits in escrow. The lowest honest bid wins, and payment is released only when delivery is confirmed.

**Architecture:** `labs/16-procurement/` built with the Lab Recipe (plan 02). The phases are enforced by `block.timestamp`: `Bidding → Reveal → Awarded → Delivered` (or `NoWinner`). All money moves out through `withdraw()` (pull).

**Tech Stack:** Foundry, forge-std, Solidity ^0.8.24.

**Spec:** `docs/superpowers/specs/2026-10-29-abc-learning-platform-design.md`. Recipe: plan 02 § Lab Recipe.

**Adapted from:** `Plan.md` Workshop 5 ("sealed-bid tender … automated escrow … `payable` … `block.timestamp`") and Solidity docs "Blind Auction". The highest bid becomes the lowest price, and the bidder's deposit becomes a fixed `BOND`.

## Global Constraints

- Plan 02 constraints apply.
- `BOND = 0.1 ether`, paid with `bid`. Sealed bid: `keccak256(abi.encodePacked(msg.sender, price, salt))` with `uint256 price` and `bytes32 salt`.
- Bonds of revealed bidders who lose go back to them. Bonds of bidders who never reveal go to the agency, as a penalty for wasting the tender. The winner's bond is returned with payment.
- A bid above `budget` is valid to reveal but can't win.
- The budget is `msg.value` of the constructor, and it must be > 0.

## Review Focus

1. **Revealing with the wrong salt or price.** `BadReveal`, and the bond stays locked until finalize, then goes to the agency. `test_US3_BadRevealForfeits`.
2. **Two bids tie on the lowest price.** The earlier *revealed* one wins (deterministic). `test_US4_TieEarlierReveal`.
3. **Everyone bids above budget, or nobody reveals.** `NoWinner`, the agency withdraws the full budget plus forfeited bonds, and losers withdraw bonds. `test_US4_NoWinner`.
4. **Boundary timestamps:** a bid at exactly `biddingEnd` reverts `TooLate`, a reveal at exactly `biddingEnd` is allowed, and a reveal at `revealEnd` reverts. `test_US2_BidAtBoundary`, `test_US3_RevealBoundaries`.
5. **Escrow solvency:** after everyone withdraws, the contract's balance is 0. `test_US6_DrainsToZero`.

## lab.json

`{ "n": 16, "slug": "procurement", "title": "Transparent Public Procurement", "kind": "build", "summary": "Run a sealed-bid government tender with escrowed funds and payment on delivery.", "concepts": ["commit-reveal", "payable", "block.timestamp", "escrow", "pull payments", "state machine"], "adaptedFrom": "Plan.md Workshop 5 + Solidity docs Blind Auction", "docs": ["m07-by-example/03-blind-auction", "m08-security/06-withdrawal-pattern", "m08-security/08-state-machine"], "openFiles": ["README.md", "src/Tender.sol"] }`

## Interface (`src/Tender.sol`)

```solidity
contract Tender {
    enum Phase { Bidding, Reveal, Awarded, Delivered, NoWinner }
    error NotAgency(); error ZeroBudget(); error WrongBond(); error AlreadyBid(); error TooEarly(); error TooLate();
    error NoBid(); error BadReveal(); error AlreadyRevealed(); error WrongPhase(); error NothingToWithdraw(); error TransferFailed();
    event BidSubmitted(address indexed supplier);
    event BidRevealed(address indexed supplier, uint256 price);
    event Awarded(address indexed winner, uint256 price);
    event NoWinnerDeclared();
    event DeliveryConfirmed(address indexed winner, uint256 price);

    uint256 public constant BOND = 0.1 ether;
    address public immutable agency;
    uint256 public immutable budget;
    uint256 public immutable biddingEnd;
    uint256 public immutable revealEnd;
    string public description;
    address public winner;
    uint256 public winningPrice;
    mapping(address => bytes32) public sealedBids;
    mapping(address => bool) public revealed;
    mapping(address => uint256) public pendingWithdrawals;

    constructor(string memory description_, uint256 biddingTime, uint256 revealTime) payable;
    function phase() public view returns (Phase);   // derived from time + stored outcome
    function sealBid(uint256 price, bytes32 salt) public view returns (bytes32);   // helper uses msg.sender
    function bid(bytes32 sealedBid) external payable;            // Bidding; msg.value == BOND; one per supplier
    function reveal(uint256 price, bytes32 salt) external;       // Reveal window
    function finalize() external;                                // after revealEnd; sets winner or NoWinner; credits bonds
    function confirmDelivery() external;                         // agency; Awarded → Delivered; credits winner price + bond, agency budget - price
    function withdraw() external;
}
```

## User stories → tests (budget 10 ether, bidding 3 days, reveal 2 days; suppliers kofi, esi, yaw)

| # | Story | Tests |
|---|---|---|
| US1 | The agency opens a tender with the budget in escrow | `test_US1_Open` (balance 10 ether, phase Bidding), `test_US1_ZeroBudget` |
| US2 | Suppliers submit sealed bids with a bond | `test_US2_Bid`, `test_US2_WrongBond`, `test_US2_OneBidEach`, `test_US2_BidAtBoundary` |
| US3 | Suppliers reveal in the reveal window | `test_US3_Reveal`, `test_US3_RevealBoundaries`, `test_US3_BadRevealForfeits`, `test_US3_DoubleReveal` |
| US4 | The lowest revealed bid within budget wins | `test_US4_LowestWins`, `test_US4_OverBudgetCannotWin`, `test_US4_TieEarlierReveal`, `test_US4_NoWinner`, `test_US4_FinalizeTooEarly` |
| US5 | Payment is released only on confirmed delivery | `test_US5_ConfirmDelivery` (credits), `test_US5_OnlyAgency`, `test_US5_WrongPhase` |
| US6 | Everyone withdraws what they're owed | `test_US6_Withdraw`, `test_US6_NothingToWithdraw`, `test_US6_DrainsToZero` |

## Starter

Declarations, the constructor (sets immutables, checks the budget), and `phase()` are given, because the time logic in `phase()` is not the lesson. Everything else is TODO.

## README

The civic story (fake invoices, altered bids), a timeline diagram of the three windows, the user stories, and a link to the m07 blind-auction lesson. **Discuss:** Sealed bids hide prices, but everyone can see *who* bid and when. Does that still leak information that could help collusion?

---

### Task A: Tests and solution

- [ ] **Step 1:** Create `labs/16-procurement/foundry.toml` (copied from lab 08) and the test file with every test in the Tests table.
- [ ] **Step 2:** Write the full solution in `src/Tender.sol` against the Interface above.
- [ ] **Step 3: Run in a Codespace.** `cd labs/16-procurement && forge test`. Expected: `21 passed; 0 failed`.
- [ ] **Step 4:** `mkdir -p .solution/src && cp src/Tender.sol .solution/src/`
- [ ] **Step 5: Commit.** `git add labs/16-procurement && git commit -m "test(lab-16): tests and reference solution"`

### Task B: Starter, README, metadata

- [ ] **Step 1:** Turn `src/Tender.sol` into the starter, using the Starter section above. Keep every declaration the tests use.
- [ ] **Step 2:** Write `README.md` and `lab.json` as above, then run `node scripts/sync-labs.mjs`.
- [ ] **Step 3: Verify.** `bash scripts/verify-lab.sh labs/16-procurement`. Expected: `PASS labs/16-procurement`.
- [ ] **Step 4: Commit.** `git add -A labs/16-procurement .devcontainer site/src/labs.json && git commit -m "feat(lab-16): Transparent Public Procurement lab"`

