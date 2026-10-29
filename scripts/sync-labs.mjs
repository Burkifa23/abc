// Generates .devcontainer/<NN-slug>/devcontainer.json and site/src/labs.json from labs/*/lab.json.
// Usage: node scripts/sync-labs.mjs [--check]
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REQUIRED = ["n", "slug", "title", "kind", "summary", "concepts", "adaptedFrom", "docs", "openFiles"];
const dirName = (l) => `${String(l.n).padStart(2, "0")}-${l.slug}`;

export function readLabs(root) {
  const labsDir = join(root, "labs");
  const labs = [];
  for (const d of readdirSync(labsDir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const file = join(labsDir, d.name, "lab.json");
    if (!existsSync(file)) continue;
    const lab = JSON.parse(readFileSync(file, "utf8"));
    for (const f of REQUIRED) if (lab[f] === undefined) throw new Error(`${file}: missing ${f}`);
    if (!["learn", "build"].includes(lab.kind)) throw new Error(`${file}: kind must be learn or build`);
    if (d.name !== dirName(lab)) throw new Error(`${d.name}: folder must be ${dirName(lab)}`);
    labs.push(lab);
  }
  return labs.sort((a, b) => a.n - b.n);
}

export function devcontainerFor(lab) {
  const nn = String(lab.n).padStart(2, "0");
  return {
    name: `Lab ${nn}: ${lab.title}`,
    build: { dockerfile: "../Dockerfile" },
    workspaceFolder: `/workspaces/\${localWorkspaceFolderBasename}/labs/${dirName(lab)}`,
    ...(lab.features && { features: lab.features }),
    customizations: {
      codespaces: { openFiles: lab.openFiles },
      vscode: {
        extensions: ["NomicFoundation.hardhat-solidity"],
        settings: { "files.exclude": { ".solution": true, out: true, cache: true, "lab.json": true } },
      },
    },
    postAttachCommand: "forge build --silent && echo 'Run: forge test'",
  };
}

export function labsIndex(labs) {
  return labs.map((l) => ({
    ...l,
    dir: dirName(l),
    codespaceUrl: `https://codespaces.new/Burkifa23/abc?quickstart=1&devcontainer_path=.devcontainer%2F${dirName(l)}%2Fdevcontainer.json`,
    sourceUrl: `https://github.com/Burkifa23/abc/tree/main/labs/${dirName(l)}`,
  }));
}

const json = (o) => JSON.stringify(o, null, 2) + "\n";

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const labs = readLabs(root);
  const outputs = new Map(labs.map((l) => [join(root, ".devcontainer", dirName(l), "devcontainer.json"), json(devcontainerFor(l))]));
  outputs.set(join(root, "site", "src", "labs.json"), json(labsIndex(labs)));
  const check = process.argv.includes("--check");
  const stale = [];
  for (const [path, text] of outputs) {
    if (existsSync(path) && readFileSync(path, "utf8") === text) continue;
    stale.push(path);
    if (!check) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, text);
    }
  }
  if (check && stale.length) {
    console.error("Stale generated files (run node scripts/sync-labs.mjs):\n" + stale.join("\n"));
    process.exit(1);
  }
}
