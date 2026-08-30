#!/usr/bin/env node
/*
 * Fast, dependency-free syntax gate: `node --check` every JS/MJS file the game
 * ships or tools with. Runs first in `npm run check` so a parse error fails
 * before ESLint/Prettier even start.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOTS = ['src', 'scripts'];
const EXT = new Set(['.js', '.mjs', '.cjs']);

const files = [];
for (const root of ROOTS) {
  let entries;
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    continue;
  }
  for (const entry of entries) {
    if (entry.isFile() && EXT.has(extname(entry.name))) {
      files.push(join(root, entry.name));
    }
  }
}
files.push('eslint.config.mjs');

let failed = 0;
for (const file of files.sort()) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    console.log(`  ok    ${file}`);
  } catch (err) {
    failed += 1;
    const detail = err.stderr ? err.stderr.toString().trim() : err.message;
    console.error(`  FAIL  ${file}\n${detail}\n`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} file(s) failed the syntax check`);
  process.exit(1);
}
console.log(`\n${files.length} file(s) OK`);
