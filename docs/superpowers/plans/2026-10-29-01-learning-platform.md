# Learning Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/docs/` into a course of MDX lessons, each with MCQs and, where it has code, browser exercises (Monaco + solc), diagrams, saved progress, and a check that the lessons cover every Solidity docs section.

**Architecture:** An Astro content collection `lessons` (MDX) is validated against `site/src/content/solidity-toc.json`. Interactive parts are plain `<script>` modules inside Astro components, with no UI framework. All logic that can be tested (quiz scoring, progress, exercise checks, mining) lives in `site/src/lib/*.ts` and is tested with `bun test`. The compiler runs in a classic Web Worker served from `public/`.

**Tech Stack:** Astro 7, `@astrojs/mdx`, `@monaco-editor/loader`, official `soljson` (binaries.soliditylang.org), `@noble/hashes`, Bun test runner.

**Spec:** `docs/superpowers/specs/2026-10-29-abc-learning-platform-design.md`

## Global Constraints

- Every internal URL is built from `import.meta.env.BASE_URL` (currently `/abc/`). This includes the worker URL.
- Colours come only from the CSS tokens in `site/src/styles/global.css`. Diagrams use `currentColor`, `var(--fg)`, `var(--muted-fg)` and `var(--border)`.
- No UI framework (React, Svelte, …). Astro components plus `<script>` only.
- Build locally with `bun --bun astro build` from `site/`, because Node 22.17 is below Astro 7's floor. Run tests with `bun test` from `site/`.
- One pinned compiler build for every exercise: `SOLC_BUILD` in `site/src/lib/solc.ts`.
- Progress key: `localStorage["abc:progress"]`.

## Review Focus

1. **`localStorage` throws (Safari private mode, blocked storage):** the page still works and progress just isn't saved. Test in Task 2.
2. **A regex check target that only appears in a comment** (for example `// TODO: use unchecked`): the check must fail. Test in Task 4.
3. **The compiler download fails or is slow (campus Wi-Fi):** the exercise shows "Compiler failed to load. Retry" and the quiz keeps working. Verification step in Task 3.
4. **The theme is toggled while an editor is open:** Monaco switches between `vs` and `vs-dark`. Verification step in Task 4.
5. **Links outside the `/abc/` base on GitHub Pages:** no `href="/…"` in `dist` misses the base. Verification step in Task 6.

---

### Task 1: Lessons collection, lesson route, coverage

**Files:**
- Modify: `site/package.json` (add `@astrojs/mdx`), `site/astro.config.mjs` (add `mdx()` to `integrations`)
- Create: `site/src/content.config.ts`, `site/src/content/modules.ts`, `site/src/lib/coverage.ts`, `site/src/lib/coverage.test.ts`
- Create: `site/src/layouts/Lesson.astro`, `site/src/pages/docs/[...slug].astro`, `site/src/pages/docs/index.astro`
- Create: `site/src/content/lessons/m01-smart-contracts/02-simple-storage.mdx` (seed lesson, the real text comes from plan 03)
- Delete: `site/src/pages/docs.astro` (its Solidity notes move into plan 03 lessons)

**Interfaces:**
- Produces:
  - Collection `lessons`. The entry `id` is `"<module>/<lesson>"`, for example `m01-smart-contracts/02-simple-storage`.
  - Frontmatter schema: `{ title: string; summary: string; covers: TocId[]; labs?: string[] }`. The module comes from the folder and the order from the 2-digit filename prefix. `TocId` is `z.enum(toc.map(e => e.id))`, so an unknown id fails the build.
  - `modules: { id: string; title: string }[]` in `site/src/content/modules.ts`, in course order. The 10 ids are in plan 03.
  - `coverage(tocIds: string[], lessons: { id: string; covers: string[] }[]): { missing: string[]; byId: Record<string, string[]> }`

- [ ] **Step 1: Write the failing test** in `site/src/lib/coverage.test.ts`

```ts
import { expect, test } from "bun:test";
import { coverage } from "./coverage";

test("reports uncovered ids and maps ids to lessons", () => {
  const r = coverage(["A", "A > x", "B"], [
    { id: "m1/01-a", covers: ["A", "A > x"] },
    { id: "m1/02-b", covers: ["A"] },
  ]);
  expect(r.missing).toEqual(["B"]);
  expect(r.byId["A"]).toEqual(["m1/01-a", "m1/02-b"]);
});
```

- [ ] **Step 2: Run the test and confirm it fails.** `cd site && bun test src/lib/coverage.test.ts`. Expected: FAIL, cannot find module `./coverage`.
- [ ] **Step 3: Implement `coverage` in `site/src/lib/coverage.ts`.** `missing` keeps the order of the TOC.
- [ ] **Step 4: Run the test and confirm it passes.** Same command. Expected: PASS.
- [ ] **Step 5: Add MDX and the collection.** `cd site && bun add @astrojs/mdx`. Write `content.config.ts` with `glob({ pattern: "**/*.mdx", base: "./src/content/lessons" })` and the schema above, importing `z` from `astro/zod`.
- [ ] **Step 6: Build the routes.** `docs/[...slug].astro` uses `getStaticPaths` over `getCollection("lessons")` and `render(entry)` inside `Lesson.astro`. `Lesson.astro` reuses `Base.astro` and `.docs`, `.sidebar`, `.prose` from `global.css`. It renders:
  - a sidebar of modules, each listing its lessons in filename order
  - prev/next links across modules
  - a "Docs sections covered" list. Each id links to `https://docs.soliditylang.org/en/latest/search.html?q=<last segment of id>`.

  `docs/index.astro` lists the modules and their lessons, then a "Reference coverage" table with one row per TOC id: the id, its PDF page, and links to the lessons that cover it. In page frontmatter, if `process.env.STRICT_COVERAGE === "1"` and `missing.length > 0`, throw `new Error("Uncovered docs sections: " + missing.join(", "))`.
- [ ] **Step 7: Verify.** `cd site && bun --bun astro build`. Expected: the build succeeds, and `dist/docs/m01-smart-contracts/02-simple-storage/index.html` and `dist/docs/index.html` exist. Then run `STRICT_COVERAGE=1 bun --bun astro build`. Expected: it fails with "Uncovered docs sections".
- [ ] **Step 8: Commit.** `git add site && git commit -m "feat(site): lessons collection, lesson pages, docs coverage"`

---

### Task 2: Quiz and progress

**Files:**
- Create: `site/src/lib/quiz.ts`, `site/src/lib/quiz.test.ts`, `site/src/lib/progress.ts`, `site/src/lib/progress.test.ts`, `site/src/components/Quiz.astro`
- Modify: `site/src/layouts/Lesson.astro` (sidebar ticks), `site/src/styles/global.css` (quiz styles, using existing tokens)

**Interfaces:**
- Produces:
  - `type Question = { q: string; options: string[]; answer: number; explain: string }`
  - `score(questions: Question[], picks: (number | null)[]): { correct: number; total: number; allCorrect: boolean }`
  - `type Progress = Record<string, { quiz?: boolean; exercises?: Record<string, boolean> }>`
  - `createProgress(storage?: Pick<Storage, "getItem" | "setItem">): { get(): Progress; markQuiz(lessonId: string, ok: boolean): void; markExercise(lessonId: string, exerciseId: string, ok: boolean): void; isDone(lessonId: string, exerciseIds: string[]): boolean }`. If no storage is passed, it uses `globalThis.localStorage` and falls back to an in-memory map when that is missing or throws.
  - DOM event `abc:progress` on `document` after every mark.
  - `<Quiz questions={Question[]} />`, used once per lesson at the end.

- [ ] **Step 1: Write the failing tests**

```ts
// quiz.test.ts
test("score counts only exact picks", () => {
  const qs = [{ q: "a", options: ["x", "y"], answer: 1, explain: "" }, { q: "b", options: ["x", "y"], answer: 0, explain: "" }];
  expect(score(qs, [1, null])).toEqual({ correct: 1, total: 2, allCorrect: false });
  expect(score(qs, [1, 0]).allCorrect).toBe(true);
});
// progress.test.ts
test("lesson is done only when quiz and all exercises pass", () => {
  const m = new Map<string, string>();
  const p = createProgress({ getItem: k => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) });
  p.markQuiz("m1/01", true);
  expect(p.isDone("m1/01", ["e1"])).toBe(false);
  p.markExercise("m1/01", "e1", true);
  expect(p.isDone("m1/01", ["e1"])).toBe(true);
  expect(JSON.parse(m.get("abc:progress")!)["m1/01"].quiz).toBe(true);
});
test("throwing storage does not throw", () => {
  const bad = { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("denied"); } };
  const p = createProgress(bad);
  expect(() => p.markQuiz("x", true)).not.toThrow();
  expect(p.isDone("x", [])).toBe(true);
});
```

- [ ] **Step 2: Run the tests and confirm they fail.** `cd site && bun test src/lib/quiz.test.ts src/lib/progress.test.ts`. Expected: FAIL, modules not found.
- [ ] **Step 3: Implement `score` and `createProgress`.** If storage throws, keep the state in a module variable.
- [ ] **Step 4: Run the tests and confirm they pass.** Same command. Expected: PASS (3 tests).
- [ ] **Step 5: Build `Quiz.astro`.**
  - Render a `<fieldset>` per question with radio inputs, plus one "Check answers" button.
  - Put the questions JSON in `data-questions` and the lesson id in `data-lesson` (`Astro.url.pathname` → lesson id).
  - On check, each question shows ✓, or ✗ followed by `explain`.
  - The summary reads "N of M correct". `markQuiz(lesson, allCorrect)` is called on check.
  - Inputs must be keyboard-reachable and labelled.
- [ ] **Step 6: Add the sidebar ticks.** `Lesson.astro` reads progress on load and on `abc:progress`, and adds `data-done` to finished lesson links (rendered as a ✓ via CSS). The exercise ids for each lesson come from `data-exercises` on the lesson's `<article>`, which Task 4 fills in.
- [ ] **Step 7: Verify in the browser.** `bun --bun astro dev`, open the seed lesson, answer one question wrong, then all right. Expected: the explanations show, and the sidebar tick appears after a reload.
- [ ] **Step 8: Commit.** `git commit -am "feat(site): MCQ quiz and local progress"` (add the new files first).

---

### Task 3: In-browser compiler

**Files:**
- Create: `site/public/solc-worker.js`, `site/src/lib/solc.ts`, `site/src/lib/solc.test.ts`

**Interfaces:**
- Produces:
  - `SOLC_BUILD: string`, for example `"soljson-v0.8.30+commit.73712a01.js"`. Pin it to the `latestRelease` entry of `https://binaries.soliditylang.org/bin/list.json` at implementation time. It must be `>= 0.8.24`.
  - `buildInput(source: string): string`: standard JSON. `language: "Solidity"`, a single source `Exercise.sol`, `outputSelection: { "*": { "*": ["abi"] } }`, optimizer off.
  - `type SolcError = { severity: "error" | "warning" | "info"; formattedMessage: string; message: string }`
  - `type AbiItem = { type: string; name?: string; inputs?: { type: string }[]; outputs?: { type: string }[]; stateMutability?: string }`
  - `type CompileResult = { errors: SolcError[]; contracts: Record<string, AbiItem[]> }` (contract name → ABI, from `Exercise.sol` only)
  - `parseOutput(json: string): CompileResult`
  - `compile(source: string): Promise<CompileResult>`. It uses one shared worker and rejects with `Error("Compiler failed to load")` if the worker fails.

- [ ] **Step 1: Write the failing test.** `buildInput("contract A {}")` parses to an object with `sources["Exercise.sol"].content === "contract A {}"`. `parseOutput` on a fixture `{"errors":[{"severity":"warning","message":"w","formattedMessage":"W"}],"contracts":{"Exercise.sol":{"A":{"abi":[{"type":"function","name":"f","inputs":[],"outputs":[],"stateMutability":"pure"}]}}}}` returns `contracts.A[0].name === "f"` and one warning. Missing `errors` or `contracts` keys give `[]` / `{}`.
- [ ] **Step 2: Run the test and confirm it fails.** `bun test src/lib/solc.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `buildInput`, `parseOutput`, `compile`.** `compile` creates `new Worker(import.meta.env.BASE_URL + "solc-worker.js")` once and matches replies by an incrementing `id`.
- [ ] **Step 4: Write `public/solc-worker.js`.** It is a classic worker, because soljson is not an ES module.

```js
let compile;
function ready(cb) { Module.calledRun ? cb() : (Module.onRuntimeInitialized = cb); }
self.onmessage = (e) => {
  const { id, url, input } = e.data;
  try {
    if (!compile) importScripts(url);
    ready(() => {
      compile ??= Module.cwrap("solidity_compile", "string", ["string", "number", "number"]);
      postMessage({ id, output: compile(input, 0, 0) });
    });
  } catch (err) { postMessage({ id, error: String(err) }); }
};
```

  `url` is `https://binaries.soliditylang.org/bin/${SOLC_BUILD}`.
- [ ] **Step 5: Run the tests and confirm they pass.** `bun test src/lib/solc.test.ts`. Expected: PASS.
- [ ] **Step 6: Verify the failure path.** In dev, temporarily set `SOLC_BUILD = "nope.js"`, call `compile("contract A{}")` from the console, and confirm the promise rejects with "Compiler failed to load". Revert the change.
- [ ] **Step 7: Commit.** `git commit -m "feat(site): in-browser solc worker"` (after `git add`).

---

### Task 4: Exercise checks and `<CodeExercise>`

**Files:**
- Create: `site/src/lib/checks.ts`, `site/src/lib/checks.test.ts`, `site/src/components/CodeExercise.astro`
- Modify: `site/package.json` (`@monaco-editor/loader`), `site/src/layouts/Lesson.astro` (collect exercise ids into `data-exercises`)

**Interfaces:**
- Consumes: `CompileResult`, `compile` (Task 3); `createProgress().markExercise` (Task 2)
- Produces:
  - `type Check = { type: "compiles" } | { type: "noWarnings" } | { type: "regex"; pattern: string; flags?: string; message: string } | { type: "abi"; contract: string; kind: "function" | "event" | "error"; name: string; inputs: string[]; outputs?: string[]; stateMutability?: "pure" | "view" | "nonpayable" | "payable"; absent?: boolean; message: string }`
  - `stripComments(source: string): string`
  - `runChecks(source: string, result: CompileResult, checks: Check[]): { ok: boolean; message: string }[]`. The default messages are "Compiles without errors" and "No compiler warnings". `abi` with `absent: true` passes when the item is not in the ABI (used for visibility lessons).
  - `<CodeExercise id="string" starter={string} checks={Check[]} solution={string} />`. Lesson authors use it in MDX.

- [ ] **Step 1: Write the failing tests**

```ts
const ok: CompileResult = { errors: [], contracts: { Coin: [{ type: "function", name: "mint", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [], stateMutability: "nonpayable" }] } };
test("regex ignores comments", () => {
  const src = "// unchecked { ++i; }\ncontract A {}";
  expect(runChecks(src, ok, [{ type: "regex", pattern: "unchecked\\s*\\{", message: "use unchecked" }])[0].ok).toBe(false);
});
test("abi matches name, input types and mutability", () => {
  const c = { type: "abi", contract: "Coin", kind: "function", name: "mint", inputs: ["address", "uint256"], stateMutability: "nonpayable", message: "m" } as const;
  expect(runChecks("", ok, [c])[0].ok).toBe(true);
  expect(runChecks("", ok, [{ ...c, inputs: ["address"] }])[0].ok).toBe(false);
  expect(runChecks("", ok, [{ ...c, absent: true }])[0].ok).toBe(false);
});
test("compiles fails on error severity only", () => {
  const warn = { ...ok, errors: [{ severity: "warning", message: "", formattedMessage: "" }] } as CompileResult;
  expect(runChecks("", warn, [{ type: "compiles" }, { type: "noWarnings" }]).map(r => r.ok)).toEqual([true, false]);
});
```

- [ ] **Step 2: Run the tests and confirm they fail.** `bun test src/lib/checks.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `stripComments` and `runChecks`.** `stripComments` removes `//…` to end of line and `/*…*/`. It doesn't need to understand comment markers inside string literals. Mark this with a `ponytail:` comment and name the upgrade path (use the solc AST).
- [ ] **Step 4: Run the tests and confirm they pass.** Expected: PASS.
- [ ] **Step 5: Build `CodeExercise.astro`.**
  - **Editor:** Monaco via `@monaco-editor/loader` with `loader.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@<pinned>/min/vs" } })`, language `sol`. Pin the version to the one `@monaco-editor/loader` resolves to at install. The theme is `vs-dark` when `document.documentElement` is dark (matching `theme.js`) and is re-applied on clicks of `[data-theme-toggle]`.
  - **Run:** clicking "Run checks" calls `compile` then `runChecks`, and renders a ✓/✗ list plus compiler errors in a `<pre>`. If every check passes, it calls `markExercise(lesson, id, true)`.
  - **Solution:** a "Show solution" button replaces the editor content after it is clicked twice (the first click asks to confirm).
  - **Reset:** a "Reset" button restores `starter`.
  - **Saved code:** the student's code is kept per exercise in `localStorage["abc:code:<lesson>:<id>"]`, wrapped in try/catch.
  - **Loading:** while the compiler loads, the button shows "Loading compiler…". On a load failure it shows "Compiler failed to load. Retry".
- [ ] **Step 6: Verify in the browser.** Add an exercise to the seed lesson (`SimpleStorage`, checks: compiles, abi `set(uint256)` nonpayable, abi `get()` view outputs `["uint256"]`). Run it with the starter (expect ✗), then with the solution (expect all ✓, sidebar tick if the quiz is done). Toggle the theme and confirm the editor recolours. Throttle the network to Offline before the first run and confirm the retry message shows while the quiz still works.
- [ ] **Step 7: Commit.** `git commit -m "feat(site): Monaco Solidity exercises with compiler-backed checks"` (after `git add`).

---

### Task 5: Diagrams and interactive demos

**Files:**
- Create: `site/src/components/Figure.astro`, `site/src/components/diagrams/ChainOfBlocks.astro`, `site/src/components/HashPlayground.astro`, `site/src/components/MiningDemo.astro`, `site/src/lib/mining.ts`, `site/src/lib/mining.test.ts`
- Modify: `site/package.json` (`@noble/hashes`)

**Interfaces:**
- Produces:
  - `<Figure caption="string"><svg …/></Figure>`, the wrapper every diagram uses: `<figure>` with a bordered card and a muted caption.
  - `mine(opts: { data: string; prevHash: string; difficulty: number; maxTries?: number }): { nonce: number; hash: string } | null`. The hash is `sha256Hex(nonce + prevHash + data)`, the same formula as freeCodeCamp's web3 mining lesson. It succeeds when the hash starts with `difficulty` × `"0"`, and `maxTries` defaults to `1_000_000`.
  - `sha256Hex(s: string): string`, `keccakHex(s: string): string`, both from `@noble/hashes`.
  - The pattern every static diagram in plan 03 follows: an Astro component in `site/src/components/diagrams/`, `viewBox` only (no fixed width), `role="img"` plus `<title>`, and only `currentColor` and the tokens.

- [ ] **Step 1: Write the failing test**

```ts
test("mine finds a nonce whose hash has the prefix and is reproducible", () => {
  const r = mine({ data: "[]", prevHash: "0", difficulty: 2 })!;
  expect(r.hash.startsWith("00")).toBe(true);
  expect(sha256Hex(r.nonce + "0" + "[]")).toBe(r.hash);
});
test("mine gives up after maxTries", () => {
  expect(mine({ data: "x", prevHash: "0", difficulty: 64, maxTries: 10 })).toBeNull();
});
test("keccakHex matches the known empty-string hash", () => {
  expect(keccakHex("")).toBe("c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470");
});
```

- [ ] **Step 2: Run the tests and confirm they fail.** `bun test src/lib/mining.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `mining.ts`.**
- [ ] **Step 4: Run the tests and confirm they pass.** Expected: PASS.
- [ ] **Step 5: Build the components.**
  - `HashPlayground`: a text input and two live outputs (SHA-256 and keccak-256). Changing one character visibly changes the whole hash.
  - `MiningDemo`: data, previous hash, a difficulty select (1–4), and a "Mine" button. It shows the nonce, the hash, the number of tries, and the elapsed time. At difficulty 4 it runs in chunks with `setTimeout` so the page stays responsive.
  - `ChainOfBlocks`: three blocks drawn as SVG cards, each showing hash and prevHash, with arrows linking prevHash to the previous block's hash.
- [ ] **Step 6: Verify in the browser.** Put all three on a scratch lesson `m00-foundations/03-blocks-and-mining.mdx` (plan 03 replaces the text). Check them in light and dark, and at 375px width (no horizontal scroll).
- [ ] **Step 7: Commit.** `git commit -m "feat(site): figure wrapper, hash playground, mining demo"` (after `git add`).

---

### Task 6: Navigation, home page and CI

**Files:**
- Modify: `site/src/pages/index.astro` (the hero's primary CTA "Start learning" goes to `${base}docs/`, plus a new "Course" section listing the 10 modules from `modules.ts`), `site/src/layouts/Base.astro` (nav label "Docs" stays and points to the course index)
- Modify: `.github/workflows/pages.yml`

- [ ] **Step 1: Update the home page and nav** as listed above.
- [ ] **Step 2: Update CI.** In `pages.yml`, before `withastro/action`, add `oven-sh/setup-bun@v2` and `cd site && bun install && bun test`. Pass `STRICT_COVERAGE: ${{ vars.STRICT_COVERAGE }}` as a job env var, so the check can be switched on from repo settings once plan 03 is done.
- [ ] **Step 3: Verify the build and base path.** `cd site && bun test && bun --bun astro build && ! grep -rhoE 'href="/[^"]*"' dist | grep -v '^href="/abc/'`. Expected: the tests pass, the build succeeds, and the grep prints nothing (exit 0).
- [ ] **Step 4: Commit.** `git commit -am "feat(site): course navigation, home CTA, tests in CI"`

---

## Not in this plan

- **Runtime checks in the browser** (calling functions on an in-browser EVM): add `@ethereumjs/vm` later if the compile, ABI and regex checks prove too weak. The Codespaces labs cover runtime behaviour.
- **Cross-device progress:** this needs a backend, which the spec excludes.
- **Hidden answers:** quiz answers and solutions are visible in the page source. That's fine for self-study. If quizzes are ever graded, move them server-side.
