# ABC Learning Platform: Design

**Date:** 2026-10-29 · **Status:** draft for review · **Repo:** https://github.com/Burkifa23/abc

## Intent

The Ashesi Blockchain Community (ABC) site has to *teach*. A student who has never written Solidity should be
able to learn the entire language as described in the official Solidity docs (v0.8.39, 428 pages), check their
understanding as they go, and then prove it by building real contracts. The civic focus from `Plan.md`
(elections, procurement, land titles) is where the curriculum ends up. Teaching is how students get there.

## What exists today

- `site/`: Astro 7 static site with Home, Docs, and Labs pages, shadcn neutral tokens, Geist font,
  and light/dark themes. It deploys to GitHub Pages at `https://burkifa23.github.io/abc/` (`base: "/abc/"`).
- `labs/03-campus-elections/`: one Foundry lab with a starter, tests, and a solution.
- `.devcontainer/`: a shared `Dockerfile` (Foundry plus forge-std at `/opt/forge-std`) and one devcontainer per lab.

## Goals

1. **Course ("Docs")**: lessons that cover every chapter and section (depth ≤ 2) of the Solidity docs outline in
   `site/src/content/solidity-toc.json` (extracted from the v0.8.39 PDF outline) (229 entries), plus a blockchain-foundations module adapted from
   freeCodeCamp's web3 curriculum.
2. **Check understanding in the browser**: every lesson ends with multiple-choice questions (MCQs). Lessons with
   code include Monaco editor exercises that compile real Solidity in the browser and check the result.
3. **Visual explanations**: diagrams for the ideas students struggle with (blocks and hashes, data locations,
   storage slots, call vs delegatecall, ABI encoding, reentrancy). Two are interactive: a hash playground and a
   mining demo.
4. **Labs**: Codespaces projects that follow freeCodeCamp's pattern of *learn-X-by-building-Y* followed by
   *build-Z* (integrated) projects. They adapt the web3, Solana, and NEAR curricula to Solidity and end with the
   civic workshops from `Plan.md`.
5. **Host everything on GitHub Pages**: no backend.

## Non-goals

- User accounts, a server, or saving progress across devices. Progress lives in `localStorage` and is per-browser.
- Running Foundry tests in the browser. The browser compiles and checks static and ABI properties. Runtime
  behaviour is tested in the Codespaces labs.
- Mainnet deployment and real funds.
- Translating the docs word for word. Lessons are written in our own words, use short adapted examples,
  and link to the matching section of docs.soliditylang.org (the docs are GPL-3.0).

## Anti-goals

- A lesson that only reads like a summary of the docs, with no question or exercise. That would fail even if
  coverage is 100%.
- Labs that need local installs. If a student has to install Node or Foundry to take part, we've failed.
- Labs whose solution has never been run. CI must prove every lab's solution passes and its starter fails.

## Decisions

| Area | Decision |
|---|---|
| Site | Astro 7 with `@astrojs/mdx`. Lessons are MDX in a content collection. GitHub Pages via `withastro/action`. |
| Routes | `/docs/` is the course index. `/docs/<module>/<lesson>/` is a lesson. `/labs/` lists labs. |
| Lesson schema | frontmatter `title`, `module`, `order`, `summary`, `covers: string[]` (ids from the TOC JSON), `labs?: string[]` |
| Coverage | A script fails the build if any TOC id is not listed in at least one lesson's `covers`. |
| MCQ | `<Quiz questions={[{ q, options, answer, explain }]} />`, scored client-side, at least 4 questions per lesson. |
| Editor | Monaco loaded with `@monaco-editor/loader` from jsDelivr, using Monaco's built-in `sol` language. |
| Compiler | Official `soljson` from binaries.soliditylang.org, run in a classic Web Worker through `cwrap("solidity_compile")`. One pinned version is shared by all exercises. |
| Exercise checks | `compiles`, `noWarnings`, `regex`, and `abi` (function or event or error, with exact types and mutability). The logic is a pure function with `bun test` tests. |
| Diagrams | Hand-written inline-SVG Astro components that use the colour tokens. The *anatomy* skill (`bunx skills add wheresryan22/anatomy -g`) is an optional authoring aid for writers, not a runtime dependency. |
| Progress | `localStorage["abc:progress"]`. A lesson is done when its quiz is all correct and its exercises pass. |
| Labs | Foundry, `pragma ^0.8.24`, forge-std pinned in the Dockerfile. Each lab has `lab.json` and a `.solution/` that mirrors `src/`. |
| Lab metadata | `scripts/sync-labs.mjs` generates each `.devcontainer/<slug>/devcontainer.json` and `site/src/labs.json` from the `lab.json` files. |
| Lab CI | For every lab, the starter compiles and `forge test` fails. With `.solution/` copied over `src/`, `forge test` passes. |
| Learn labs | Numbered steps in the README. Each step has its own test named `test_NN_*`, so students can run `forge test --mt test_NN`. |
| Build labs | User stories in the README. Each story maps to one or more tests. |

## Lab sequence (adapted sources)

| # | Slug | Kind | Adapted from |
|---|---|---|---|
| 01 | hello-foundry | learn | Solana/NEAR "set up … hello world" |
| 02 | mini-blockchain | learn | web3 "digital ledgers" and "proof-of-work" |
| 03 | signatures | learn | web3 "digital signatures by building a wallet" |
| 04 | video-game-marketplace | build | web3 "build a video game marketplace blockchain" |
| 05 | shared-bank | learn | Plan.md Workshop 2 and docs "Subcurrency" |
| 06 | word-guess | learn | NEAR "word guessing game" |
| 07 | sentence-maker | build | NEAR "build a sentence-making smart contract" |
| 08 | campus-elections | build | Plan.md Workshop 3 and docs "Voting" |
| 09 | fungible-token | learn | Solana "token program, fungible token" |
| 10 | fundraising | build | web3 "build a fundraising smart contract" |
| 11 | anonymous-access | build | Plan.md Workshop 4 |
| 12 | tic-tac-toe | learn | Solana "Anchor tic-tac-toe" parts 1 and 2 |
| 13 | leaderboard | build | Solana "build an Anchor leaderboard" |
| 14 | concert-tickets | learn | web3 "NFTs by building concert tickets" (placeholder in fCC, written fresh) |
| 15 | certification-nft | build | Solana "university certification NFT" |
| 16 | procurement | build | Plan.md Workshop 5 and docs "Blind Auction" |
| 17 | land-registry | build | Plan.md Workshop 6 |
| 18 | fortune-teller-dapp | build | NEAR "fortune teller" plus Solana/NEAR client-side app projects |
| 19 | deploy | learn | Solana "deploy to devnet / build for mainnet" |
| 20 | open-source-africa | build | Plan.md Workshop 7 and Solana "freeform app" |

## Constraints

- GitHub Pages: static output only, every link uses `import.meta.env.BASE_URL`, no server routes.
- The visual system stays as built: shadcn neutral tokens in `site/src/styles/global.css`, Geist, light and dark.
- Locally, Node 22.17 can't run Astro 7 and npm is broken, so build with `bun --bun astro build` from `site/`.
  CI uses the Node version from the withastro action.
- A lab must work in Codespaces with no extra setup. Students only run `forge test`.

## Left to the builder

The wording of lessons, the questions themselves, and the visual detail of diagrams, all within the rules above.
