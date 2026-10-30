import { describe, test, expect } from "bun:test";
import { Glob } from "bun";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import solc from "solc";
import { SOLC_BUILD, buildInput, parseOutput } from "../lib/solc";
import { runChecks } from "../lib/checks";

// ponytail: solc-js loads once at import; the npm package is pinned to SOLC_BUILD's version.
const root = join(import.meta.dir, "lessons");
const mdxFiles = [...new Glob("**/*.mdx").scanSync(root)].map((f) => f.replaceAll("\\", "/")).sort();
const codeLike = /[`;{]|function|contract|uint|mapping/;

const build = (src: string) => parseOutput(solc.compile(buildInput(src)));

test("finds lessons", () => expect(mdxFiles.length).toBeGreaterThan(0));
test("solc package matches SOLC_BUILD", () => {
  const v = SOLC_BUILD.match(/soljson-v([0-9.]+)[+]/)![1];
  expect(solc.version().startsWith(v)).toBe(true);
});

for (const file of mdxFiles) {
  describe(`lesson ${file}`, async () => {
    const mdx = readFileSync(join(root, file), "utf8");
    const sidecar = join(root, file.replace(/\.mdx$/, ".ts"));
    const has = existsSync(sidecar);
    const mod = has ? await import(sidecar) : { quiz: [], exercises: {} };

    test("has sidecar .ts", () => expect(has).toBe(true));
    test("has <Quiz", () => expect(mdx).toContain("<Quiz"));
    test("mdx uses its sidecar", () => {
      const slug = file.split("/").pop()!.replace(/[.]mdx$/, "");
      expect(mdx).toContain(`from "./${slug}"`);
      expect(mdx).toContain("questions={quiz}");
    });

    test("quiz rules", () => {
      const quiz = mod.quiz;
      expect(quiz.length).toBeGreaterThanOrEqual(5);
      for (const q of quiz) {
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length).toBe(true);
        expect(q.explain.trim()).not.toBe("");
      }
      expect(quiz.filter((q: any) => codeLike.test(q.q + q.options.join(" "))).length).toBeGreaterThanOrEqual(2);
      expect(new Set(quiz.map((q: any) => q.answer)).size).toBeGreaterThan(1);
    });

    test("quiz has no length or position tell", () => {
      const quiz: any[] = mod.quiz;
      const len = (o: string) => o.trim().length;
      const longest: number[] = [], shortest: number[] = [];
      quiz.forEach((q, i) => {
        const L = q.options.map(len), a = L[q.answer];
        const others = L.filter((_: number, j: number) => j !== q.answer);
        if (a > Math.max(...others)) longest.push(i + 1);
        if (a < Math.min(...others)) shortest.push(i + 1);
      });
      const counts = new Map<number, number[]>();
      quiz.forEach((q, i) => counts.set(q.answer, [...(counts.get(q.answer) ?? []), i + 1]));
      const crowded = [...counts].filter(([, qs]) => qs.length > quiz.length / 2);
      expect(longest.length <= 2, `${file}: correct option strictly longest in Q${longest.join(", Q")}`).toBe(true);
      expect(shortest.length <= 2, `${file}: correct option strictly shortest in Q${shortest.join(", Q")}`).toBe(true);
      expect(crowded.length === 0, `${file}: answer index ${crowded.map(([a]) => a)} used by Q${crowded.flatMap(([, qs]) => qs).join(", Q")}`).toBe(true);
    });

    test("exercise ids match mdx", () => {
      const ids = [...mdx.matchAll(/<CodeExercise\b[^>]*?\sid=["']([^"']+)["']/g)].map((m) => m[1]).sort();
      expect(Object.keys(mod.exercises).sort()).toEqual(ids);
    });

    for (const [id, ex] of Object.entries<any>(mod.exercises)) {
      test(`exercise ${id}: starter fails, solution passes`, () => {
        expect(ex.checks.some((c: any) => c.type === "compiles")).toBe(true);
        const fails = runChecks(ex.starter, build(ex.starter), ex.checks).filter((r) => !r.ok);
        expect(fails.length).toBeGreaterThanOrEqual(1);
        const bad = runChecks(ex.solution, build(ex.solution), ex.checks).filter((r) => !r.ok);
        expect(bad.map((r) => r.message)).toEqual([]);
      });
    }
  });
}
