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
