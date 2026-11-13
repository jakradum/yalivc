// Upload a deck PDF to the private `team-decks` bucket, shown on team.yali.vc/assets
// (src/lib/teamDecks.js). One folder per deck; the page shows the highest vX.Y in
// each folder and keeps the rest under "Earlier versions". Re-uploading the same
// file name replaces it.
//   node scripts/upload-team-deck.mjs <folder> <file.pdf> [...more.pdf]
//   e.g. node scripts/upload-team-deck.mjs theses-overview ~/Desktop/"Yali Investment Theses Overview v1.4.pdf"
// Reads SUPABASE_URL and SUPABASE_SECRET_KEY from .env.local.
import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(readFileSync(join(ROOT, '.env.local'), 'utf8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^"|"$/g, '')]));
const URL_ = env.SUPABASE_URL, KEY = env.SUPABASE_SECRET_KEY;

const [folder, ...files] = process.argv.slice(2);
if (!folder || !/^[a-z0-9-]+$/.test(folder) || !files.length) {
  console.error('usage: node scripts/upload-team-deck.mjs <folder> <file.pdf> [...]');
  process.exit(1);
}
for (const file of files) {
  const name = basename(file);
  if (!name.toLowerCase().endsWith('.pdf')) throw new Error(`not a PDF: ${name}`);
  const path = `${folder}/${name}`.split('/').map(encodeURIComponent).join('/');
  const res = await fetch(`${URL_}/storage/v1/object/team-decks/${path}`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/pdf', 'x-upsert': 'true' },
    body: readFileSync(file),
  });
  if (!res.ok) throw new Error(`${name}: ${res.status} ${await res.text()}`);
  console.log(`uploaded team-decks/${folder}/${name}`);
}
