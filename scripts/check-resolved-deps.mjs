#!/usr/bin/env node
/**
 * Guards the failure mode that npm ci cannot see: a lockfile that installs
 * cleanly but does not give you the versions package.json asks for.
 *
 * Two checks, both portable (they read what is actually installed, not the
 * lockfile bytes, which are not identical across platforms):
 *
 *  1. Every exactly-pinned dependency resolves to that exact version, in the
 *     workspace that declares it AND at the hoisted root. This is the bug that
 *     shipped next 16.3.0 into apps/rules-guru while package.json said 16.3.4.
 *
 *  2. react and react-dom agree everywhere. React throws at startup when they
 *     differ, which took out a whole test suite at collection time when a bump
 *     left the hoisted root react-dom a patch behind.
 */
import { readFileSync, existsSync } from 'node:fs';
import { globSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? '.');
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const EXACT = /^\d+\.\d+\.\d+(?:-[\w.]+)?$/;

const manifests = ['package.json', ...globSync(['apps/*/package.json', 'packages/*/package.json'], { cwd: root })]
  .map((p) => join(root, p))
  .filter((p) => existsSync(p));

const installed = (fromDir, name) => {
  let dir = fromDir;
  while (true) {
    const p = join(dir, 'node_modules', name, 'package.json');
    if (existsSync(p)) return { version: read(p).version, path: p };
    const up = dirname(dir);
    if (up === dir || !dir.startsWith(root)) return null;
    dir = up;
  }
};

const problems = [];

for (const manifest of manifests) {
  const pkg = read(manifest);
  const dir = dirname(manifest);
  const rel = manifest.slice(root.length + 1) || 'package.json';
  for (const section of ['dependencies', 'devDependencies']) {
    for (const [name, range] of Object.entries(pkg[section] ?? {})) {
      if (!EXACT.test(range)) continue;
      const got = installed(dir, name);
      if (!got) {
        problems.push(`${rel}: ${name} pinned to ${range} but not installed`);
      } else if (got.version !== range) {
        problems.push(`${rel}: ${name} pinned to ${range} but ${got.version} is installed (${got.path.slice(root.length + 1)})`);
      }
    }
  }
}

const PAIRS = [['react', 'react-dom']];
for (const dir of [root, ...manifests.map(dirname)]) {
  for (const [a, b] of PAIRS) {
    const va = installed(dir, a);
    const vb = installed(dir, b);
    if (va && vb && va.version !== vb.version) {
      problems.push(`${dir.slice(root.length + 1) || '.'}: ${a} ${va.version} != ${b} ${vb.version} (React refuses to start on a mismatch)`);
    }
  }
}

const unique = [...new Set(problems)];
if (unique.length) {
  console.error('Resolved dependency check FAILED:\n');
  for (const p of unique) console.error('  - ' + p);
  console.error('\nFix: rm -rf node_modules apps/*/node_modules packages/*/node_modules package-lock.json && npm install, then commit the lockfile.');
  process.exit(1);
}
console.log(`OK: ${manifests.length} manifests checked, all pinned versions resolve exactly and react/react-dom agree.`);
