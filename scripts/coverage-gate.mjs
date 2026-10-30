// Reads `forge coverage --report summary` from stdin and exits 1 if line coverage of any src/*.sol file
// (not src/interfaces/) is below the threshold. Usage: forge coverage --report summary | node coverage-gate.mjs 90
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

/** Returns { checked: [{file, pct}], failing: [{file, pct}] } for a forge summary table. */
export function gate(table, min) {
  const checked = [];
  for (const line of table.split(/\r?\n/)) {
    const cols = line.split("|").map((c) => c.trim());
    const file = cols[1];
    if (!file || !file.startsWith("src/") || file.startsWith("src/interfaces/")) continue;
    const m = /^([\d.]+)%/.exec(cols[2] ?? "");
    if (m) checked.push({ file, pct: Number(m[1]) });
  }
  return { checked, failing: checked.filter((c) => c.pct < min) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const min = Number(process.argv[2]);
  if (!Number.isFinite(min)) {
    console.error("usage: forge coverage --report summary | node coverage-gate.mjs <min-percent>");
    process.exit(2);
  }
  const { checked, failing } = gate(readFileSync(0, "utf8"), min);
  if (checked.length === 0) {
    console.error("coverage gate: no src/*.sol rows found in the coverage table");
    process.exit(1);
  }
  for (const c of checked) console.log(`${c.pct >= min ? "ok  " : "LOW "} ${c.file} ${c.pct}%`);
  if (failing.length) {
    console.error(`coverage gate: ${failing.length} file(s) below ${min}% line coverage`);
    process.exit(1);
  }
}
