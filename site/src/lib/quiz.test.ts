import { expect, test } from "bun:test";
import { score } from "./quiz";

test("score counts only exact picks", () => {
  const qs = [{ q: "a", options: ["x", "y"], answer: 1, explain: "" }, { q: "b", options: ["x", "y"], answer: 0, explain: "" }];
  expect(score(qs, [1, null])).toEqual({ correct: 1, total: 2, allCorrect: false });
  expect(score(qs, [1, 0]).allCorrect).toBe(true);
});
