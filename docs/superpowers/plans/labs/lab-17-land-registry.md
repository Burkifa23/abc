# Lab 17: Immutable Land Title Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `Plan.md` Workshop 6. A land registry where each physical plot maps to exactly one ERC-721 title, so a corrupt clerk can't issue two titles for the same land. Disputed plots can be frozen, and every past owner stays on record.

**Architecture:** `labs/17-land-registry/` built with the Lab Recipe (plan 02). The starter ships a **complete** `src/ERC721Minimal.sol` base contract with an overridable `_beforeTransfer(from, to, id)` hook. Students write `src/LandRegistry.sol is ERC721Minimal`. This lab is about inheritance and registry rules, not about rewriting ERC-721 a third time.

**Tech Stack:** Foundry, forge-std, Solidity ^0.8.24.

**Spec:** `docs/superpowers/specs/2026-10-29-abc-learning-platform-design.md`. Recipe: plan 02 § Lab Recipe.

**Adapted from:** `Plan.md` Workshop 6 ("map physical plots to unique, non-duplicable tokens … ERC721 … secure asset transfer").

## Global Constraints

- Plan 02 constraints apply.
- A plot is identified by `(string region, uint256 plotNumber)`. `tokenId = uint256(keccak256(abi.encode(region, plotNumber)))`. Use `abi.encode`, not `encodePacked`, because the region is dynamic.
- The registrar (deployer) is the only one who registers and can freeze. Owners transfer their own titles with ordinary ERC-721 transfers, unless the title is disputed.

## Review Focus

1. **Registering the same plot twice** (the core fraud). Revert `AlreadyRegistered(tokenId)`. `test_US2_NoDoubleTitle`.
2. **`("Accra", 12)` vs `("Accra1", 2)` style collisions.** These are distinct ids because `abi.encode` is used. `test_US1_NoEncodingCollision`.
3. **A transfer of a disputed title**, including through an approved operator. Revert `Disputed(tokenId)` in the hook. `test_US4_DisputedBlocksOperator`.
4. **The ownership history after several sales.** All owners in order, with the registrant first. `test_US5_History`.
5. **Resolving a dispute by reassigning** (a court order). Allowed only for the registrar, it bypasses the dispute freeze, and it records history. `test_US6_CourtOrderReassign`.

## lab.json

`{ "n": 17, "slug": "land-registry", "title": "Immutable Land Title Registry", "kind": "build", "summary": "One plot, one title: map land to unique NFTs, freeze disputes and keep the full ownership history.", "concepts": ["inheritance", "virtual/override hooks", "ERC-721", "abi.encode ids", "access control"], "adaptedFrom": "Plan.md Workshop 6", "docs": ["m06-contracts/11-inheritance", "m06-contracts/12-multiple-inheritance", "m09-under-the-hood/05-abi-specification"], "openFiles": ["README.md", "src/LandRegistry.sol", "src/ERC721Minimal.sol"] }`

## Interface

`src/ERC721Minimal.sol` (complete in the starter):
```solidity
abstract contract ERC721Minimal is IERC721 {
    // balanceOf, ownerOf, approve, getApproved, setApprovalForAll, isApprovedForAll, transferFrom, safeTransferFrom x2
    function _mint(address to, uint256 id) internal;
    function _transfer(address from, address to, uint256 id) internal;   // calls _beforeTransfer, no auth check
    function _beforeTransfer(address from, address to, uint256 id) internal virtual {}
}
```
`src/LandRegistry.sol`:
```solidity
contract LandRegistry is ERC721Minimal {
    struct Plot { string region; uint256 plotNumber; uint256 areaSqm; bool disputed; }
    error NotRegistrar(); error AlreadyRegistered(uint256 id); error UnknownPlot(uint256 id); error Disputed(uint256 id); error ZeroArea();
    event PlotRegistered(uint256 indexed id, string region, uint256 plotNumber, address indexed owner);
    event DisputeSet(uint256 indexed id, bool disputed);
    event CourtOrderTransfer(uint256 indexed id, address indexed from, address indexed to);

    address public immutable registrar;
    function plotId(string calldata region, uint256 plotNumber) public pure returns (uint256);
    function register(string calldata region, uint256 plotNumber, uint256 areaSqm, address owner) external returns (uint256 id);
    function plot(uint256 id) external view returns (Plot memory);
    function setDisputed(uint256 id, bool disputed) external;
    function courtOrderTransfer(uint256 id, address to) external;    // registrar; ignores dispute
    function ownershipHistory(uint256 id) external view returns (address[] memory);
    function _beforeTransfer(address from, address to, uint256 id) internal override; // dispute check + history
}
```

## User stories → tests

| # | Story | Tests |
|---|---|---|
| US1 | Each plot has one deterministic id | `test_US1_PlotId`, `test_US1_NoEncodingCollision` |
| US2 | Only the registrar issues titles, and never twice | `test_US2_Register` (owner, `PlotRegistered`, `plot()` data), `test_US2_OnlyRegistrar`, `test_US2_NoDoubleTitle`, `test_US2_ZeroArea` |
| US3 | Owners sell titles with normal transfers | `test_US3_OwnerTransfers`, `test_US3_StrangerCannot` |
| US4 | Disputed plots are frozen | `test_US4_FreezeBlocksTransfer`, `test_US4_DisputedBlocksOperator`, `test_US4_Unfreeze`, `test_US4_OnlyRegistrarFreezes` |
| US5 | Every owner is on record | `test_US5_History` |
| US6 | A court order can reassign a frozen plot | `test_US6_CourtOrderReassign`, `test_US6_OnlyRegistrarCourtOrder` |
| US7 | Unknown plots revert clearly | `test_US7_UnknownPlot` |

## Starter

`ERC721Minimal.sol` and the interfaces are complete. `LandRegistry.sol` has the declarations, `registrar = msg.sender`, and TODO bodies, including the `_beforeTransfer` override (TODO: "check dispute unless this is a court order; push `to` into history").

## README

The land-fraud story, how inheritance and hooks work, and the user stories. **Discuss:** The chain guarantees one title per plot *id*. What stops a clerk registering the same field under a slightly different region name ("Accra" vs "Greater Accra")?

---

### Task A: Tests and solution

- [ ] **Step 1:** Create `labs/17-land-registry/foundry.toml` (copied from lab 08) and the test file with every test in the Tests table.
- [ ] **Step 2:** Write the full solution in `src/LandRegistry.sol` against the Interface above.
- [ ] **Step 3: Run in a Codespace.** `cd labs/17-land-registry && forge test`. Expected: `16 passed; 0 failed`.
- [ ] **Step 4:** `mkdir -p .solution/src && cp src/LandRegistry.sol .solution/src/`
- [ ] **Step 5: Commit.** `git add labs/17-land-registry && git commit -m "test(lab-17): tests and reference solution"`

### Task B: Starter, README, metadata

- [ ] **Step 1:** Turn `src/LandRegistry.sol` into the starter, using the Starter section above. Keep every declaration the tests use.
- [ ] **Step 2:** Write `README.md` and `lab.json` as above, then run `node scripts/sync-labs.mjs`.
- [ ] **Step 3: Verify.** `bash scripts/verify-lab.sh labs/17-land-registry`. Expected: `PASS labs/17-land-registry`.
- [ ] **Step 4: Commit.** `git add -A labs/17-land-registry .devcontainer site/src/labs.json && git commit -m "feat(lab-17): Immutable Land Title Registry lab"`

