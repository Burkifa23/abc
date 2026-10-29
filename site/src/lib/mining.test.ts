import { test, expect } from "bun:test";
import { mine, sha256Hex, keccakHex } from "./mining";

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
