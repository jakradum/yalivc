#!/usr/bin/env node
// Fails if any file listed in src/decks/LEGACY_HASHES.json has changed.
// Run before committing. Override only with LEGACY_EDIT_OK=1, set by a
// human who means it.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const hashesPath = path.join(root, 'src/decks/LEGACY_HASHES.json');
const hashes = JSON.parse(fs.readFileSync(hashesPath, 'utf8'));

let failed = false;
for (const [relPath, expected] of Object.entries(hashes)) {
  const filePath = path.join(root, relPath);
  if (!fs.existsSync(filePath)) {
    console.error(`[deck-legacy-guard] MISSING: ${relPath} (expected to exist, untouched)`);
    failed = true;
    continue;
  }
  const actual = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  if (actual !== expected) {
    console.error(`[deck-legacy-guard] CHANGED: ${relPath}`);
    console.error(`  expected sha256 ${expected}`);
    console.error(`  actual   sha256 ${actual}`);
    failed = true;
  }
}

if (failed && process.env.LEGACY_EDIT_OK !== '1') {
  console.error(
    '\nLegacy deck file(s) changed. This project deliberately never edits them.\n' +
    'If this was intentional, set LEGACY_EDIT_OK=1 and update src/decks/LEGACY_HASHES.json.'
  );
  process.exit(1);
}

if (!failed) {
  console.log('[deck-legacy-guard] OK — legacy files unchanged.');
}
