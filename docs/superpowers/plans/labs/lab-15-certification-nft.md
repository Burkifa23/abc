# Lab 15: University Certification NFT Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A build project. Ashesi issues non-transferable ("soulbound") NFT certificates to graduates. Employers can verify them, and nobody can sell or move them.

**Architecture:** `labs/15-certification-nft/` built with the Lab Recipe (plan 02). It is an ERC-721 that implements reading and minting, while every transfer and approval reverts. ERC-5192 `locked()` signals that tokens are soulbound.

**Tech Stack:** Foundry, forge-std, Solidity ^0.8.24.

**Spec:** `docs/superpowers/specs/2026-10-29-abc-learning-platform-design.md`. Recipe: plan 02 § Lab Recipe.

**Adapted from:** Solana "build a university certification NFT" (Metaplex). The university wallet as payer and mint authority becomes `university` (immutable deployer). `mintToken(..., year)` with name `SOL-{year}`, symbol `SOLU`, 0 royalties, immutable, becomes `issue(student, year, uri)` with name `ASH-{year}`, symbol `ASHU`, and soulbound. `getNFTs(owner)` becomes `certificatesOf(owner)`. Upload metadata to storage becomes a `uri` argument (IPFS is out of scope).

## Global Constraints

- Plan 02 constraints apply.
- Reuse the ERC-721 knowledge from lab 14, but this lab stands alone. It ships the same `src/interfaces/*` files, plus `IERC5192.sol` (`event Locked(uint256 tokenId)`, `function locked(uint256) external view returns (bool)`, interface id `0xb45a3c0e`).
- A certificate's `year` must be within 2002..2100 (Ashesi was founded in 2002). Otherwise revert `InvalidYear(year)`.

## Review Focus

1. **Any transfer path** (`transferFrom`, both `safeTransferFrom`) **and any approval path** (`approve`, `setApprovalForAll`) revert `Soulbound`. `test_US4_AllTransfersBlocked`, `test_US4_ApprovalsBlocked`.
2. **Revoking a certificate** (fraud found). The university burns it: `ownerOf` reverts afterwards, and it disappears from `certificatesOf`. `test_US6_RevokeRemovesFromList`.
3. **Issuing to `address(0)`.** `ERC721InvalidReceiver(address(0))`. `test_US2_ZeroStudent`.
4. **A student with several certificates** (BSc, then MSc). `certificatesOf` returns all of them in issue order. `test_US5_Multiple`.

## lab.json

`{ "n": 15, "slug": "certification-nft", "title": "University Certification NFT", "kind": "build", "summary": "Issue soulbound graduation certificates anyone can verify and nobody can sell.", "concepts": ["ERC-721", "soulbound tokens", "ERC-5192", "burning", "array removal"], "adaptedFrom": "Solana: build a university certification NFT", "docs": ["m06-contracts/13-abstract-and-interfaces", "m06-contracts/11-inheritance"], "openFiles": ["README.md", "src/Certificates.sol"] }`

## Interface (`src/Certificates.sol`)

```solidity
contract Certificates is IERC721, IERC721Metadata, IERC5192 {
    struct Certificate { address student; uint16 year; string uri; }
    error NotUniversity(); error Soulbound(); error InvalidYear(uint16 year);
    error ERC721NonexistentToken(uint256 id); error ERC721InvalidReceiver(address receiver);
    event Issued(uint256 indexed id, address indexed student, uint16 year);
    event Revoked(uint256 indexed id);

    address public immutable university;
    function issue(address student, uint16 year, string calldata uri) external returns (uint256 id); // ids from 1; emits Transfer, Locked, Issued
    function revoke(uint256 id) external;                   // burn: Transfer(student, 0, id), Revoked
    function certificate(uint256 id) external view returns (Certificate memory);
    function certificateName(uint256 id) external view returns (string memory);   // "ASH-<year>"
    function certificatesOf(address owner) external view returns (uint256[] memory);
    function locked(uint256 id) external view returns (bool);   // true for existing ids
    // IERC721 read functions implemented; write functions revert Soulbound.
    // name() "Ashesi University Certificates", symbol() "ASHU", tokenURI(id) = stored uri
}
```

## User stories → tests

| # | Story | Tests |
|---|---|---|
| US1 | Only the university issues certificates | `test_US1_OnlyUniversity` |
| US2 | Issuing mints a token to the student | `test_US2_Issue` (owner, balance, `Transfer`, `Locked`, `Issued`, `tokenURI`), `test_US2_ZeroStudent`, `test_US2_InvalidYear` (2001 and 2101) |
| US3 | Certificates have readable details | `test_US3_Details` (`certificateName(1)=="ASH-2026"`, struct fields), `test_US3_Nonexistent` |
| US4 | Certificates can't be moved or approved | `test_US4_AllTransfersBlocked`, `test_US4_ApprovalsBlocked`, `test_US4_LockedTrue` |
| US5 | Anyone can list a student's certificates | `test_US5_Multiple` |
| US6 | The university can revoke | `test_US6_Revoke`, `test_US6_RevokeRemovesFromList`, `test_US6_OnlyUniversityRevokes` |
| US7 | Wallets and marketplaces can detect the standards | `test_US7_SupportsInterface` (ERC-165, ERC-721, metadata, `0xb45a3c0e`) |

## Starter

The interfaces are complete. The contract has declarations and `university = msg.sender`. Bodies are TODO. The README hints at swap-and-pop for removing ids from a student's list.

## README

The Solana University story retold for Ashesi, the user stories, and a "Metaplex ↔ ERC-721" table. **Discuss:** A student loses their wallet key. With soulbound certificates, what should the university's recovery process be?

---

### Task A: Tests and solution

- [ ] **Step 1:** Create `labs/15-certification-nft/foundry.toml` (copied from lab 08) and the test file with every test in the Tests table.
- [ ] **Step 2:** Write the full solution in `src/Certificates.sol` against the Interface above.
- [ ] **Step 3: Run in a Codespace.** `cd labs/15-certification-nft && forge test`. Expected: `14 passed; 0 failed`.
- [ ] **Step 4:** `mkdir -p .solution/src && cp src/Certificates.sol .solution/src/`
- [ ] **Step 5: Commit.** `git add labs/15-certification-nft && git commit -m "test(lab-15): tests and reference solution"`

### Task B: Starter, README, metadata

- [ ] **Step 1:** Turn `src/Certificates.sol` into the starter, using the Starter section above. Keep every declaration the tests use.
- [ ] **Step 2:** Write `README.md` and `lab.json` as above, then run `node scripts/sync-labs.mjs`.
- [ ] **Step 3: Verify.** `bash scripts/verify-lab.sh labs/15-certification-nft`. Expected: `PASS labs/15-certification-nft`.
- [ ] **Step 4: Commit.** `git add -A labs/15-certification-nft .devcontainer site/src/labs.json && git commit -m "feat(lab-15): University Certification NFT lab"`

