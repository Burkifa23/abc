#!/usr/bin/env bash
# Usage: verify-lab.sh <lab-dir>. Starter must compile and fail; .solution must pass.
set -euo pipefail
lab="${1:?usage: verify-lab.sh <lab-dir>}"
export REPO_ROOT; REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cp -r "$lab/." "$tmp/"
cd "$tmp"

forge build >/dev/null 2>&1 || { echo "FAIL: starter does not compile"; exit 1; }
if forge test >/dev/null 2>&1; then echo "FAIL: starter already passes"; exit 1; fi
cp -r .solution/. .
forge test >/dev/null 2>&1 || { echo "FAIL: solution fails"; exit 1; }

if [ -f lab.json ]; then
  extra="$(node -e 'process.stdout.write(require("./lab.json").extraCheck||"")')"
  if [ -n "$extra" ]; then bash -c "$extra" || { echo "FAIL: extra check"; exit 1; }; fi
fi
echo "PASS $lab"
