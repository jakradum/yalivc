// Sends the Fund II term vote email (src/lib/lp-vote-email.js), one email per LP, from
// Yali Investor Relations <noreply@yali.vc> via Resend, in batches so the daily Resend
// limit is never hit. Every send is logged in the Supabase doc lpVoteSend.fund2-term,
// which the team dashboard reads and which stops anyone getting the email twice.
//
//   node scripts/lp-vote-send.mjs --closes "5 December 2026" --test a@yali.vc,b@yali.vc
//   node scripts/lp-vote-send.mjs --closes "5 December 2026" --batch 90 [--dry-run]
//
// --test sends to the listed addresses only and does not log them. --batch sends to the
// next N LPs with portal access who have not been sent it yet (staff excluded).
// Reads SUPABASE_URL, SUPABASE_SECRET_KEY, PORTAL_AUTH_SECRET, RESEND_API_KEY from the
// environment or .env.local. Prints addresses only for --test.
import fs from 'fs';

if (fs.existsSync('.env.local')) {
  for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=["']?(.*?)["']?$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const arg = (name) => { const i = process.argv.indexOf(`--${name}`); return i > -1 ? process.argv[i + 1] : null; };
const closes = arg('closes');
const test = arg('test');
const batch = Number(arg('batch') || 0);
const dry = process.argv.includes('--dry-run');
if (!closes || (!test && !batch)) {
  console.error('Usage: --closes "<date>" and either --test <emails> or --batch <n> [--dry-run]');
  process.exit(1);
}

const { Resend } = await import('resend');
const { voteEmail } = await import('../src/lib/lp-vote-email.js');
const { VOTE } = await import('../src/lib/lp-vote.js');
const { listDocs, getDoc, putDoc } = await import('../src/lib/private-docs.js');
const { isYaliStaff } = await import('../src/lib/internal-user.js');

const resend = new Resend(process.env.RESEND_API_KEY);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function send(to) {
  const mail = voteEmail(to, { closes });
  if (dry) return 'dry-run';
  const { data, error } = await resend.emails.send({ from: mail.from, to, subject: mail.subject, html: mail.html, text: mail.text });
  if (error) throw new Error(error.name || 'send failed');
  return data?.id || null;
}

if (test) {
  for (const to of test.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)) {
    console.log(`test -> ${to}: ${await send(to)}`);
    await pause(600);
  }
  process.exit(0);
}

// Everyone with LP portal access (the same rule as sign-in), one entry per address.
const hasAccess = (u) => u.noAccess !== true && (u.lpPortalAccess === true || (u.lpPortalAccess == null && u.isActive === true));
const people = new Map();
for (const u of await listDocs('portalUser')) {
  const email = String(u.email || '').toLowerCase().trim();
  if (!email || isYaliStaff(email) || !hasAccess(u)) continue;
  if (!people.has(email) || (!people.get(email).name && u.name)) people.set(email, { email, name: u.name || null });
}

const logId = `lpVoteSend.${VOTE.id}`;
const log = (await getDoc(logId)) || { sent: [] };
const already = new Set(log.sent.map((x) => x.email));
const next = [...people.values()].filter((p) => !already.has(p.email)).slice(0, batch);
console.log(`LPs with access: ${people.size} | already sent: ${already.size} | this batch: ${next.length}${dry ? ' (dry run)' : ''}`);

let ok = 0;
for (const p of next) {
  try {
    const id = await send(p.email);
    if (!dry) {
      log.sent.push({ email: p.email, name: p.name, sentAt: new Date().toISOString(), resendId: id });
      await putDoc(logId, 'lpVoteSend', { voteId: VOTE.id, sent: log.sent });
    }
    ok += 1;
  } catch (err) {
    console.error(`failed for one address: ${err.message}`);
  }
  await pause(600);
}
console.log(`sent ${ok} of ${next.length}; remaining after this batch: ${people.size - already.size - ok}`);
