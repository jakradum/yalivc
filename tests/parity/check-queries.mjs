// Checks that every query in queries.mjs still appears verbatim in the original source.
// Usage: node tests/parity/check-queries.mjs   (exit 1 on drift)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Q, ROUTE_Q, LATEST_VISIBILITY_FILTER, latestLPQuarterlyReportQuery } from './queries.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => readFileSync(path.join(root, p), 'utf8');
const lib = read('src/lib/sanity-queries.js');
const routes = Object.fromEntries(
  ['portal-auth', 'dataroom-auth', 'portal-invite', 'dataroom-invite', 'check-domain'].map((r) => [r, read(`src/app/api/${r}/route.js`)])
);
const ROUTE_FILE = {
  portalAuthDomainPrivilege: ['portal-auth'],
  blockedPortalUser: ['portal-auth', 'dataroom-auth'],
  portalAuthUser: ['portal-auth'],
  portalAuthDomainSharedCode: ['portal-auth'],
  portalAuthInviteUser: ['portal-auth'],
  dataroomAuthDomainPrivilege: ['dataroom-auth'],
  dataroomAuthUser: ['dataroom-auth'],
  dataroomAuthDomainSharedCode: ['dataroom-auth'],
  dataroomAuthInviteUser: ['dataroom-auth'],
  portalInviteAccess: ['portal-invite'],
  dataroomInviteAccess: ['dataroom-invite'],
  checkDomainShared: ['check-domain'],
};

let bad = 0;
const check = (ok, what) => { if (!ok) { bad++; console.log('DRIFT', what); } };
for (const [name, q] of Object.entries(Q)) check(lib.includes('`' + q + '`'), `sanity-queries.js ${name}`);
for (const [name, q] of Object.entries(ROUTE_Q)) for (const f of ROUTE_FILE[name]) check(routes[f].includes('`' + q + '`'), `${f} ${name}`);
for (const [k, frag] of Object.entries(LATEST_VISIBILITY_FILTER)) check(lib.includes(`'${frag}'`), `getLatestLPQuarterlyReport filter ${k}`);
check(lib.includes('`' + latestLPQuarterlyReportQuery(false).replace(LATEST_VISIBILITY_FILTER.published, '${visibilityFilter}') + '`'), 'getLatestLPQuarterlyReport template');
// The number of inline GROQ lookups per route file (so a new lookup is noticed).
const COUNTS = { 'portal-auth': 6, 'dataroom-auth': 6, 'portal-invite': 1, 'dataroom-invite': 1, 'check-domain': 1 };
for (const [f, n] of Object.entries(COUNTS)) check((routes[f].match(/client\.fetch\(/g) || []).length === n, `${f} has ${n} client.fetch calls`);
console.log(bad ? `${bad} drift(s)` : `all ${Object.keys(Q).length + Object.keys(ROUTE_Q).length} queries verbatim`);
process.exit(bad ? 1 : 0);
