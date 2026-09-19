#!/usr/bin/env node
// CLI export. Requires `next dev` (or the deployed app) running at
// --base-url. Deck export is an occasional task, so a CLI hitting a
// running server is a perfectly good primary path (no legacy PDF script
// existed to match here — see DECK_MIGRATION_PLAN.md Phase 0 findings).
//
// Usage: node scripts/deck-pdf.js fund-ii [--base-url http://localhost:3000] [--out exports/]
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const deckId = args[0];
if (!deckId) {
  console.error('Usage: node scripts/deck-pdf.js <deckId> [--base-url URL] [--out DIR]');
  process.exit(1);
}
const baseUrlArg = args.indexOf('--base-url');
const baseUrl = baseUrlArg !== -1 ? args[baseUrlArg + 1] : 'http://localhost:3000';
const outArg = args.indexOf('--out');
const outDir = outArg !== -1 ? args[outArg + 1] : 'exports';

async function main() {
  const res = await fetch(`${baseUrl}/api/decks/${deckId}/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataSource: 'fixture' }),
  });
  if (!res.ok) {
    console.error(`[deck-pdf] export failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.resolve(outDir), { recursive: true });
  const outPath = path.join(outDir, `${deckId}.pdf`);
  fs.writeFileSync(outPath, buffer);
  console.log(`[deck-pdf] wrote ${outPath} (${buffer.length} bytes)`);
}

main().catch((err) => {
  console.error('[deck-pdf] error:', err);
  process.exit(1);
});
