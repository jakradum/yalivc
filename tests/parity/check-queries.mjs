// Checks that every query in queries.mjs still appears verbatim in the original source.
// (The route lookups moved out of the route files into src/lib/lp-data on 6 Nov, so only
// sanity-queries.js is checked here; ROUTE_Q is covered by run-cases.mjs.)
// Usage: node tests/parity/check-queries.mjs   (exit 1 on drift)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Q, LATEST_VISIBILITY_FILTER, latestLPQuarterlyReportQuery } from './queries.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => readFileSync(path.join(root, p), 'utf8');
const lib = read('src/lib/sanity-queries.js');
let bad = 0;
const check = (ok, what) => { if (!ok) { bad++; console.log('DRIFT', what); } };
for (const [name, q] of Object.entries(Q)) check(lib.includes('`' + q + '`'), `sanity-queries.js ${name}`);
for (const [k, frag] of Object.entries(LATEST_VISIBILITY_FILTER)) check(lib.includes(`'${frag}'`), `getLatestLPQuarterlyReport filter ${k}`);
check(lib.includes('`' + latestLPQuarterlyReportQuery(false).replace(LATEST_VISIBILITY_FILTER.published, '${visibilityFilter}') + '`'), 'getLatestLPQuarterlyReport template');
console.log(bad ? `${bad} drift(s)` : `all ${Object.keys(Q).length} queries verbatim`);
process.exit(bad ? 1 : 0);
