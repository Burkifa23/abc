# Lab 14: Concert Tickets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Students write a complete ERC-721 NFT from scratch: tickets for an Ashesi concert, with a fixed supply, a price, approvals, safe transfers, and metadata.

**Architecture:** `labs/14-concert-tickets/` built with the Lab Recipe (plan 02). The starter provides `src/interfaces/IERC165.sol`, `IERC721.sol`, `IERC721Metadata.sol` and `IERC721Receiver.sol` complete. The student implements `src/ConcertTickets.sol`.

**Tech Stack:** Foundry, forge-std, Solidity ^0.8.24.

**Spec:** `docs/superpowers/specs/2026-10-29-abc-learning-platform-design.md`. Recipe: plan 02 § Lab Recipe.

**Adapted from:** freeCodeCamp web3 "learn NFTs by building a set of concert tickets". That project is a placeholder upstream with no content, so this lab is written fresh, keeping the concert-ticket theme.

## Global Constraints

- Plan 02 constraints apply.
- Name `"Ashesi Live"`, symbol `"TIX"`, `MAX_SUPPLY = 100`, `PRICE = 0.02 ether`. Token ids start at 1.
- `tokenURI(id) = string.concat(baseURI, the decimal string of id, ".json")`. The student writes `_toString(uint256)` themselves.
- ERC-6093 errors: `ERC721NonexistentToken(uint256)`, `ERC721IncorrectOwner(address,uint256,address)`, `ERC721InsufficientApproval(address,uint256)`, `ERC721InvalidReceiver(address)`, plus `SoldOut()`, `WrongPrice()`, `NotOrganizer()`.

## Review Focus

1. **`safeTransferFrom` to a contract that doesn't implement `onERC721Received`.** Revert `ERC721InvalidReceiver`. `test_10_SafeToBadContract`.
2. **The approval is cleared on transfer.** `getApproved` is 0 afterwards. `test_08b_ApprovalCleared`.
3. **The operator approved for all can transfer but not re-approve all.** `test_09_OperatorCanTransfer`.
4. **Buying the 101st ticket.** `SoldOut`. `test_05_SoldOut` (loop 100 buys).
5. **`tokenURI` for id 0 or a nonexistent id.** `ERC721NonexistentToken`. `test_11b_UriNonexistent`.

## lab.json

`{ "n": 14, "slug": "concert-tickets", "title": "Concert Tickets (ERC-721)", "kind": "learn", "summary": "Write the ERC-721 standard from scratch and sell 100 concert tickets as NFTs.", "concepts": ["ERC-721", "ERC-165", "approvals", "safe transfers", "metadata"], "adaptedFrom": "freeCodeCamp web3: NFTs by building concert tickets (written fresh)", "docs": ["m06-contracts/13-abstract-and-interfaces", "m05-expressions/07-try-catch", "m04-units-and-globals/05-address-members-and-type-info"], "openFiles": ["README.md", "src/ConcertTickets.sol"] }`

## Interface (`src/ConcertTickets.sol`)

```solidity
contract ConcertTickets is IERC721, IERC721Metadata {
    // errors listed in Global Constraints
    uint256 public constant MAX_SUPPLY = 100;
    uint256 public constant PRICE = 0.02 ether;
    address public immutable organizer;
    uint256 public totalMinted;
    string public baseURI;

    constructor(string memory baseURI_);
    function buyTicket() external payable returns (uint256 id);        // exact PRICE
    function withdraw() external;                                      // organizer, whole balance
    function supportsInterface(bytes4 id) external pure returns (bool); // 0x01ffc9a7, 0x80ac58cd, 0x5b5e139f
    // IERC721: balanceOf, ownerOf, approve, getApproved, setApprovalForAll, isApprovedForAll,
    //          transferFrom, safeTransferFrom (both overloads)
    // IERC721Metadata: name, symbol, tokenURI
}
```

## Tests (`test/ConcertTickets.t.sol`)

The test file defines `GoodReceiver` (returns the selector) and `BadReceiver` (has no function).

| Test | Asserts |
|---|---|
| `test_01_Metadata` | name, symbol, organizer |
| `test_02_SupportsInterfaces` | 3 ids true, `0xffffffff` false |
| `test_03_BuyTicket` | id 1, owner, balance 1, `Transfer(0, ama, 1)`, `totalMinted==1` |
| `test_04_WrongPrice` | `WrongPrice` |
| `test_05_SoldOut` | `SoldOut` |
| `test_06_OwnerOfNonexistent` | `ERC721NonexistentToken(7)` |
| `test_07_TransferFrom` | owner moves the ticket; balances update |
| `test_07b_NotAllowed` | stranger → `ERC721InsufficientApproval` |
| `test_08_Approve` | `Approval` event, approved address can transfer |
| `test_08b_ApprovalCleared` | cleared after transfer |
| `test_09_OperatorCanTransfer` | `ApprovalForAll` |
| `test_10_SafeToGoodContract` | succeeds |
| `test_10_SafeToBadContract` | `ERC721InvalidReceiver` |
| `test_11_TokenURI` | `"ipfs://tix/42.json"` for id 42 |
| `test_11b_UriNonexistent` | reverts |
| `test_12_Withdraw` | organizer gets the sales |

## Starter

The interface files are complete. In `ConcertTickets.sol`, the declarations, the constructor, and empty internal helpers `_toString`, `_isAuthorized`, `_transfer` and `_checkReceiver` are given. All bodies are TODO.

## README

Twelve steps in test order, with a short "what is ERC-165" box. **Discuss:** Why does `safeTransferFrom` exist? What gets lost when an NFT is sent to a contract that can't handle it?

---

### Task A: Tests and solution

- [ ] **Step 1:** Create `labs/14-concert-tickets/foundry.toml` (copied from lab 08) and the test file with every test in the Tests table.
- [ ] **Step 2:** Write the full solution in `src/ConcertTickets.sol` against the Interface above.
- [ ] **Step 3: Run in a Codespace.** `cd labs/14-concert-tickets && forge test`. Expected: `16 passed; 0 failed`.
- [ ] **Step 4:** `mkdir -p .solution/src && cp src/ConcertTickets.sol .solution/src/`
- [ ] **Step 5: Commit.** `git add labs/14-concert-tickets && git commit -m "test(lab-14): tests and reference solution"`

### Task B: Starter, README, metadata

- [ ] **Step 1:** Turn `src/ConcertTickets.sol` into the starter, using the Starter section above. Keep every declaration the tests use.
- [ ] **Step 2:** Write `README.md` and `lab.json` as above, then run `node scripts/sync-labs.mjs`.
- [ ] **Step 3: Verify.** `bash scripts/verify-lab.sh labs/14-concert-tickets`. Expected: `PASS labs/14-concert-tickets`.
- [ ] **Step 4: Commit.** `git add -A labs/14-concert-tickets .devcontainer site/src/labs.json && git commit -m "feat(lab-14): Concert Tickets (ERC-721) lab"`

