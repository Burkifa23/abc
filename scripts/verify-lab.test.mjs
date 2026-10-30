import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, cpSync, mkdtempSync, writeFileSync, appendFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const fx = resolve(import.meta.dirname, 'fixtures');
const env = { ...process.env, PATH: `${join(fx, 'stub-forge')}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH}` };
const run = (dir) => spawnSync('bash', [resolve(import.meta.dirname, 'verify-lab.sh'), dir], { env, encoding: 'utf8' });

// Temp copy of lab-good, optionally customised.
function variant(fn) {
  const d = mkdtempSync(join(tmpdir(), 'vl-'));
  cpSync(join(fx, 'lab-good'), d, { recursive: true });
  fn(d);
  return d;
}
const withExtra = (cmd) => variant((d) => writeFileSync(join(d, 'lab.json'), JSON.stringify({ extraCheck: cmd })));

function check(name, dir, code, text, cleanup = false) {
  test(name, () => {
    const r = run(dir);
    if (cleanup) rmSync(dir, { recursive: true, force: true });
    assert.equal(r.status, code, r.stdout + r.stderr);
    assert.match(r.stdout, text);
  });
}

check('lab-good passes', join(fx, 'lab-good'), 0, /PASS/);
check('lab-bad: starter already passes', join(fx, 'lab-bad'), 1, /FAIL: starter already passes/);
check('starter does not compile', variant((d) => appendFileSync(join(d, 'src/Box.sol'), '// COMPILE_ERROR\n')), 1, /stub: build failed[\s\S]*FAIL: starter does not compile/, true);
check('solution fails', variant((d) => writeFileSync(join(d, '.solution/src/Box.sol'), '// no marker\n')), 1, /stub: test failed[\s\S]*FAIL: solution fails/, true);
check('extraCheck failing', withExtra('exit 1'), 1, /FAIL: extra check/, true);
check('extraCheck sees real REPO_ROOT', withExtra('test -f "$REPO_ROOT/scripts/verify-lab.sh"'), 0, /PASS/, true);

check('stale out/cache ignored', variant((d) => { mkdirSync(join(d, 'out')); writeFileSync(join(d, 'out/x'), '1'); }), 0, /PASS/, true);
