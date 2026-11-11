// A stand-in implementation that answers by running the ORIGINAL GROQ through groq-js over the
// documents it gets from the injected loader. It proves the harness (loader wiring, comparison,
// file-URL mapping), not the Supabase port:
//   node tests/parity/run-cases.mjs --impl tests/parity/self-check.mjs
// File URLs are rewritten to the contract's Supabase form (/partners/file/<id>,
// /dataroom/file/<id>, sometimes with ?dl=) so the harness's URL mapping is exercised.
import { FUNCTIONS, TYPES } from './queries.mjs';
import { makeFetch } from './engine.mjs';

let loader = null;
export function setDocLoader(l) { loader = l; }
export function resetDocLoader() { loader = null; }

const CDN_FILE = /^https:\/\/cdn\.sanity\.io\/files\/nt0wmty3\/production\/([0-9a-f]+)\.([A-Za-z0-9]+)$/;
function rewrite(v, prefix, n = { i: 0 }) {
  if (Array.isArray(v)) return v.map((x) => rewrite(x, prefix, n));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, rewrite(x, prefix, n)]));
  const m = typeof v === 'string' && CDN_FILE.exec(v);
  if (!m) return v;
  const id = `file-${m[1]}-${m[2]}`;
  return `${prefix}/file/${id}${n.i++ % 2 ? `?dl=${encodeURIComponent('fake name.pdf')}` : ''}`;
}

async function loadAll() {
  const docTypes = TYPES.filter((t) => !t.startsWith('sanity.'));
  const docs = (await Promise.all(docTypes.map((t) => loader.byType(t)))).flat();
  // asset docs come through byIds, like a port that resolves references would fetch them
  const refs = new Set();
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') { if (typeof v._ref === 'string' && /^(file|image)-/.test(v._ref)) refs.add(v._ref); Object.values(v).forEach(walk); }
  };
  docs.forEach(walk);
  const assets = refs.size ? await loader.byIds([...refs]) : [];
  return [...docs, ...assets];
}

for (const [name, spec] of Object.entries(FUNCTIONS)) {
  const fn = async (...args) => {
    if (!loader) throw new Error('self-check: setDocLoader was not called');
    const fetch = makeFetch(await loadAll());
    const out = await spec.run(fetch, ...args);
    return rewrite(out, spec.surface === 'dataroom' ? '/dataroom' : '/partners');
  };
  Object.defineProperty(fn, 'name', { value: name });
  // eslint-disable-next-line no-undef
  globalThis.__selfCheck ??= {};
  globalThis.__selfCheck[name] = fn;
}
const S = globalThis.__selfCheck;
export const {
  getLPFundSettings, getLPInvestments, getLPInvestmentsForPdf, getLPInvestmentByCompanySlug, getLPQuarterUpdates,
  getLPQuarterlyReportBySlug, getLPQuarterlyReportBySlugAdmin, getLatestLPQuarterlyReport, getAllLPInvestmentSlugs,
  getAvailableLPQuarters, getPortalUserByEmail, getLatestLPReportForDataRoom, getDataroomDomainPrivilege,
  getDataroomFundContent, getDataRoomDocuments, getDataRoomTrackRecords, getDataRoomFundPerformance,
  getDataRoomPortfolioCompanies, getDataRoomAllFundSettings,
  portalAuthDomainPrivilege, blockedPortalUser, portalAuthUser,
  dataroomAuthDomainPrivilege, dataroomAuthUser,
  hasPortalAccess, hasDataroomAccess,
} = S;
