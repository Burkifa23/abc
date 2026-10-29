import { expect, test } from "bun:test";
import { createProgress } from "./progress";

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
