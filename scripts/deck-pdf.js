#!/usr/bin/env node
// CLI export. Needs the app running at --base-url (`next dev`, or the
// partners subdomain). The endpoint is behind the partners portal and
// internal-only, so the CLI authenticates:
//   - local dev (default): mints a signed portal session from
//     PORTAL_AUTH_SECRET in .env.local, as --as <email> (default
//     pranav@yali.vc). Never commit or log the secret or the cookie.
//   - anywhere else: pass --cookie <portal-session value> copied from a
//     signed-in browser (it's httpOnly, so DevTools > Application).
//
// Usage: node scripts/deck-pdf.js fund-ii [--base-url URL] [--out DIR]
//          [--data fixture|sanity] [--as email] [--cookie value]
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve('.env.local'), quiet: true });

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i !== -1 ? args[i + 1] : undefined;
};

const deckId = args[0];
if (!deckId || deckId.startsWith('--')) {
  console.error('Usage: node scripts/deck-pdf.js <deckId> [--base-url URL] [--out DIR] [--data fixture|sanity] [--as email] [--cookie value]');
  process.exit(1);
}
const baseUrl = flag('--base-url') || 'http://localhost:3000';
const outDir = flag('--out') || 'exports';
const dataSource = flag('--data') === 'sanity' ? 'sanity' : 'fixture';

function sessionCookie() {
  const given = flag('--cookie');
  if (given) return given;
  const secret = process.env.PORTAL_AUTH_SECRET;
  if (!secret) {
    console.error('[deck-pdf] no --cookie given and PORTAL_AUTH_SECRET not found in .env.local');
    process.exit(1);
  }
  const email = flag('--as') || 'pranav@yali.vc';
  const ts = Date.now().toString();
  const sig = crypto.createHmac('sha256', secret).update(`${email}:${ts}`).digest('hex');
  return `${email}:${ts}:${sig}`;
}

async function main() {
  const res = await fetch(`${baseUrl}/api/decks/${deckId}/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `portal-session=${sessionCookie()}` },
    body: JSON.stringify({ dataSource }),
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
