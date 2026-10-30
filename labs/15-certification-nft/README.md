# Lab 15: University Certification NFT

**The problem:** a graduate shows an employer a printed degree. Anyone can forge paper, and employers cannot call every university to check. Ashesi wants a certificate that anyone can verify in seconds and nobody can sell, lend or buy.
**Your job:** write `src/Certificates.sol`, an ERC-721 that the university issues to graduates. Reading works as usual, but every transfer and every approval reverts. That is a *soulbound* token. ERC-5192 `locked()` tells wallets and marketplaces that a token cannot move.

On Solana the university wallet paid for and minted each certificate NFT with Metaplex (`mintToken(..., year)`, name `SOL-{year}`). Here the university is the deployer, `issue(student, year, uri)` makes the token `ASH-{year}`, and `certificatesOf(owner)` plays the role of `getNFTs(owner)`. The metadata file is just a `uri` string you pass in (uploading to IPFS is out of scope).

## User stories

Each story matches tests named `test_US<k>_...`. The interfaces are in `src/interfaces/`.

1. **Only the university issues certificates.** The deployer is `university`. Anyone else reverts `NotUniversity()`.
2. **Issuing mints a token to the student.** `issue(student, year, uri)` returns ids from 1 and emits `Transfer(0, student, id)`, `Locked(id)` and `Issued(id, student, year)`. The zero address reverts `ERC721InvalidReceiver(address(0))`. A year outside 2002..2100 (Ashesi was founded in 2002) reverts `InvalidYear(year)`. `name()` is `"Ashesi University Certificates"`, `symbol()` is `"ASHU"`, `tokenURI(id)` is the stored uri.
3. **Certificates have readable details.** `certificate(id)` returns the struct, and `certificateName(id)` is `"ASH-<year>"`. An unknown id reverts `ERC721NonexistentToken(id)`.
4. **Certificates can't be moved or approved.** `transferFrom` and both `safeTransferFrom` revert `Soulbound()`, and so do `approve` and `setApprovalForAll`. `getApproved` is always `address(0)`, `isApprovedForAll` is always `false`, and `locked(id)` is `true` for an existing certificate.
5. **Anyone can list a student's certificates.** `certificatesOf(owner)` returns every id in issue order (a BSc, then an MSc). `balanceOf` matches its length.
6. **The university can revoke.** If fraud is found, `revoke(id)` burns the token: `ownerOf` reverts afterwards, the id leaves `certificatesOf` (hint: swap-and-pop), and `Transfer(student, 0, id)` and `Revoked(id)` are emitted. Only the university may revoke.
7. **Wallets and marketplaces can detect the standards.** `supportsInterface` is true for ERC-165 (`0x01ffc9a7`), ERC-721 (`0x80ac58cd`), ERC-721 Metadata (`0x5b5e139f`) and ERC-5192 (`0xb45a3c0e`).

```bash
forge test               # run all tests
forge test --mt test_US4 # run one story
forge test -vvv          # show why a test failed
```

You're done when you see `14 passed; 0 failed`.

## Metaplex to ERC-721

| Solana (Metaplex) | Solidity |
|---|---|
| University wallet is payer and mint authority | `university` (immutable deployer), checked with `NotUniversity` |
| `mintToken(..., year)`, name `SOL-{year}` | `issue(student, year, uri)`, `certificateName` gives `ASH-{year}` |
| Immutable metadata, 0 royalties | no transfers at all, so there are no sales to take royalties from |
| `getNFTs(owner)` | `certificatesOf(owner)` |
| Metadata uploaded to storage | a `uri` string passed to `issue` |

## You'll use

`struct`, `mapping` of arrays, removing from an array with swap-and-pop, custom errors with arguments, events, and the ERC-165 / ERC-721 / ERC-5192 interfaces. See the [docs](https://burkifa23.github.io/abc/docs/).

## Discuss

A student loses their wallet key. With soulbound certificates, what should the university's recovery process be?
