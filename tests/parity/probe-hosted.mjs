// Read-only check that the answer key's engine (groq-js + the adjustments in engine.mjs) agrees
// with the HOSTED Sanity query engine on the fixtures' filter / order / pick semantics.
//
//   node tests/parity/probe-hosted.mjs [--dotenv .env.local]
//
// No documents are read or written: the fixtures are sent as a query parameter ($docs, in _id
// order, because the hosted API breaks ties by _id) and each original query's filter, order()
// and [0] pick is evaluated over them, once on the hosted API and once by engine.mjs over `*`.
// Projections with -> are not part of this check (dereference of a missing doc is null on both;
// see the evidence file). Needs SANITY_READ_TOKEN or SANITY_API_TOKEN; values are never printed.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';
import { makeFetch } from './engine.mjs';
import { inputsFor } from './inputs.mjs';
import { FUNCTIONS } from './queries.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const i = process.argv.indexOf('--dotenv');
if (i > 0) (await import('dotenv')).config({ path: process.argv[i + 1], quiet: true });
const token = process.env.SANITY_READ_TOKEN || process.env.SANITY_API_TOKEN;
if (!token) { console.error('probe-hosted: no Sanity read token in env'); process.exit(2); }
const client = createClient({ projectId: 'nt0wmty3', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token, perspective: 'published' });

const byId = (a, b) => (a._id < b._id ? -1 : a._id > b._id ? 1 : 0);
// key order is not significant (the hosted API returns object keys sorted; groq-js keeps projection order)
const canon = (v) => (Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])])) : v);
const J = (v) => JSON.stringify(canon(v));
// Hosted-safe copies: strip asset docs and large text so the parameter stays small.
const slim = (d) => {
  const { aboutCompany, updateNotes, coverNoteIntro, investmentActivityNotes, closingNotes, ecosystemNotes, pipelineNotes, investmentStrategy, ...rest } = d;
  if (rest.quarterlyUpdates) rest.quarterlyUpdates = rest.quarterlyUpdates.map(({ updateNotes: _u, tableFootnotes: _t, roundMoics: _r, keyMetrics: _k, ...q }) => q);
  return rest;
};

const LP = 'investmentStatus in ["active", "exited"] && showOnPartnerPortal != false';
const LP_VIS = '(visibility in ["internal", "published"] || (isPublished == true && !defined(visibility)))';
const PUB_VIS = '(visibility == "published" || (isPublished == true && !defined(visibility)))';
const PORTAL_USER = 'noAccess != true && (lpPortalAccess == true || (!defined(lpPortalAccess) && isActive == true))';
const DR_USER = 'noAccess != true && (investorDataRoomAccess == true || (dataRoomAccess == true && !defined(investorDataRoomAccess)))';
const ARR = `{_id, "qu": quarterlyUpdates[] | order(fiscalYear desc, quarter desc)._key, "lq": quarterlyUpdates[] | order(fiscalYear desc, quarter desc)[0]._key, "ir": investmentRounds[] | order(investmentDate asc)._key}`;

// [label, function whose inputs to use (or null), skeleton over SRC with params as ^.a / ^.b]
const SKELETONS = [
  ['getLPInvestments(+ForPdf)', null, `SRC[_type == "company" && ${LP}] | order(order asc)${ARR}`],
  ['getAllLPInvestmentSlugs', null, `SRC[_type == "company" && ${LP}] | order(order asc, name asc){_id, "ir": investmentRounds[] | order(investmentDate asc)._key}`],
  ['getDataRoomPortfolioCompanies', null, `SRC[_type == "company" && investmentStatus == "active"] | order(order asc)${ARR}`],
  ['getAvailableLPQuarters', null, `SRC[_type == "lpQuarterlyReport" && ${LP_VIS}] | order(fiscalYear desc, quarter desc){_id, "visibility": coalesce(visibility, select(isPublished == true => "published", "draft"))}`],
  ['getLatestLPQuarterlyReport(false)', null, `SRC[_type == "lpQuarterlyReport" && ${PUB_VIS}] | order(fiscalYear desc, quarter desc)[0]._id`],
  ['getLatestLPQuarterlyReport(true)', null, `SRC[_type == "lpQuarterlyReport" && ${LP_VIS}] | order(fiscalYear desc, quarter desc)[0]._id`],
  ['getDataRoomDocuments', null, `SRC[_type == "dataRoomDocument" && accessLevel == "data-room"] | order(category asc, publishedAt desc)._id`],
  ['getDataRoomTrackRecords (by investor _ref; -> not available)', null, `SRC[_type == "trackRecord"] | order(investor._ref asc, year desc)._id`],
  ['lpFundSettings [0]', null, `SRC[_type == "lpFundSettings"][0]._id`],
  ['getLPInvestmentByCompanySlug', 'getLPInvestmentByCompanySlug', `$cases[]{"r": SRC[_type == "company" && slug.current == ^.a && ${LP}][0]${ARR}}`],
  ['getLPQuarterUpdates', 'getLPQuarterUpdates', `$cases[]{"r": SRC[_type == "company" && ${LP} && count(quarterlyUpdates[quarter == ^.^.a && fiscalYear == ^.^.b]) > 0] | order(order asc){_id, "qu": quarterlyUpdates[quarter == ^.^.a && fiscalYear == ^.^.b][0]._key}}`],
  ['getLPQuarterlyReportBySlug', 'getLPQuarterlyReportBySlug', `$cases[]{"r": SRC[_type == "lpQuarterlyReport" && slug.current == ^.a && ${LP_VIS}][0]{_id, "visibility": coalesce(visibility, select(isPublished == true => "published", "draft"))}}`],
  ['getLPQuarterlyReportBySlugAdmin', 'getLPQuarterlyReportBySlugAdmin', `$cases[]{"r": SRC[_type == "lpQuarterlyReport" && slug.current == ^.a][0]._id}`],
  ['getPortalUserByEmail (JS-lowered input)', 'getPortalUserByEmail', `$cases[]{"r": SRC[_type == "portalUser" && lower(email) == ^.a && ${PORTAL_USER}][0]{_id, email}}`, (a) => (a ? a.toLowerCase() : a)],
  ['portal user lookups (route)', 'portalAuthUser', `$cases[]{"r": SRC[_type == "portalUser" && lower(email) == ^.a && ${PORTAL_USER}][0]._id}`],
  ['data room user lookups (route)', 'dataroomAuthUser', `$cases[]{"r": SRC[_type == "portalUser" && lower(email) == ^.a && ${DR_USER}][0]._id}`],
  ['blockedPortalUser', 'blockedPortalUser', `$cases[]{"r": SRC[_type == "portalUser" && lower(email) == ^.a && noAccess == true][0]._id}`],
  ['getDataroomDomainPrivilege', 'getDataroomDomainPrivilege', `$cases[]{"r": SRC[_type == "domainPrivilege" && domain == ^.a && dataroomAccess == true && isActive == true][0]._id}`],
  ['portalAuthDomainPrivilege', 'portalAuthDomainPrivilege', `$cases[]{"r": SRC[_type == "domainPrivilege" && domain == ^.a && lpPortalAccess == true && isActive == true][0]{_id, requireCode}}`],
];

let same = 0, differ = 0;
for (const scenario of ['main', 'alt']) {
  const docs = JSON.parse(readFileSync(path.join(here, 'fixtures', `${scenario}.json`), 'utf8'))
    .filter((d) => !d._type.startsWith('sanity.')).map(slim).sort(byId);
  const local = makeFetch(docs);
  for (const [label, fnName, skel, shape] of SKELETONS) {
    let cases = [];
    if (fnName) {
      cases = inputsFor(fnName, FUNCTIONS[fnName], docs, scenario)
        .filter((inp) => !(fnName === 'getPortalUserByEmail' && !inp[0])) // the original returns null before querying
        .map(([a, b]) => ({ a: shape ? shape(a) : a, b: b ?? null }));
    }
    const params = { docs, cases };
    const hosted = await client.fetch(skel.replaceAll('SRC', '$docs'), params);
    const mine = await local(skel.replaceAll('SRC', '*'), { cases });
    const ok = J(hosted) === J(mine);
    ok ? same++ : differ++;
    let where = '';
    if (!ok && Array.isArray(hosted) && Array.isArray(mine)) {
      const bad = hosted.map((h, k) => (J(h) === J(mine[k]) ? null : k)).filter((k) => k !== null);
      where = ` first differing index ${bad[0]} (${bad.length} differ)` + (cases[bad[0]] ? ` input ${J(cases[bad[0]]).slice(0, 80)}` : '') +
        `\n      hosted ${J(hosted[bad[0]]).slice(0, 200)}\n      engine ${J(mine[bad[0]]).slice(0, 200)}`;
    }
    console.log(`${ok ? 'SAME' : 'DIFF'} [${scenario}] ${label}${fnName ? ` (${cases.length} inputs)` : ''}${where}`);
  }
}
console.log(`\n${same} same, ${differ} different`);
process.exit(differ ? 1 : 0);
