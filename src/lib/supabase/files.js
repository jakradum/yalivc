// PDFs from the private Supabase twin, served through short-lived signed URLs.
//
// In Supabase mode, file fields that GROQ used to return as `asset->url` become
// `/partners/file/<assetId>` (LP portal) or `/dataroom/file/<assetId>` (data
// room). Those two route handlers call handleFileRequest() below, which:
//   1. checks the scope's session cookie (else: redirect to sign-in, like the proxy),
//   2. finds which twin documents reference the asset and through which field,
//   3. allows the file only under that scope's rules (else: 404, never 403, so
//      asset ids cannot be probed),
//   4. redirects (302, no-store) to a 10-minute signed URL for the
//      `sanity-files` bucket, as a download when `?dl=<name>` is given.
//
// Server-only: uses the Supabase secret key (bypasses RLS). Plain fetch, no deps.
// Schema: supabase/migrations/0001_sanity_twin.sql. Sync: ./twin.js.
import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import { isYaliStaff } from '@/lib/internal-user';
import { order, cmpStr } from '@/lib/lp-data/groq';
import { supaAll } from '@/lib/lp-data/rest';
import { getPortalUserByEmail, getDataroomDomainPrivilege } from '@/lib/lp-data/supabase-reads';

const BUCKET = 'sanity-files';
export const SIGNED_URL_SECONDS = 600;
const DOWNLOAD_NAME_MAX = 150;

// Sanity file asset ids: file-<sha1>-<ext>. Anything else is rejected before any lookup.
const ASSET_ID_RE = /^file-[0-9a-f]{40}-[a-z0-9]{1,10}$/;
export const isAssetId = (id) => typeof id === 'string' && ASSET_ID_RE.test(id);

// Scalar file fields (field.asset._ref) per document type, looked up with one
// PostgREST equality filter each. dataroomFundContent also has an array of files
// (commonRecommendationDocuments[].file), so that singleton is scanned whole.
const SCALAR_FILE_FIELDS = {
  lpQuarterlyReport: ['generatedPdf', 'fundFinancialsPdf', 'giftCityFundFinancialsPdf'],
  dataRoomDocument: ['file'],
};
const SCANNED_TYPES = ['dataroomFundContent'];

// Same staff rule as the portal pages (one definition, in internal-user.js).
export const isStaffEmail = isYaliStaff;

// ── PostgREST / Storage plumbing ─────────────────────────────────────────────
// Single-row and write requests use supa() below; every read that can return many
// rows uses the data layer's keyset-paged supaAll() (rest.js).

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required');
  return { url, key };
}

const eq = (value) => `eq.${encodeURIComponent(String(value))}`;

async function supa(path, { method = 'GET', body } = {}) {
  const { url, key } = config();
  const res = await fetch(`${url}${path}`, {
    method,
    cache: 'no-store',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  // Never echo the response body: it may contain document data.
  if (!res.ok) throw new Error(`Supabase ${method} ${path.split('?')[0]} → ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// Twin rows are published documents only; skip anything draft/version-shaped regardless.
const isPublishedId = (id) => typeof id === 'string' && !id.startsWith('drafts.') && !id.startsWith('versions.');

// ── Lookups ──────────────────────────────────────────────────────────────────

/** The sanity_files row for an asset, or null. */
export async function getFileAsset(assetId) {
  if (!isAssetId(assetId)) return null;
  const rows = await supa(
    `/rest/v1/sanity_files?select=asset_id,storage_path,mime_type,original_filename&asset_id=${eq(assetId)}&limit=1`
  );
  const r = rows?.[0];
  return r ? { assetId: r.asset_id, storagePath: r.storage_path, mimeType: r.mime_type, originalFilename: r.original_filename } : null;
}

const REPORT_SELECT =
  'id,type,visibility:doc->>visibility,isPublished:doc->isPublished,fiscalYear:doc->>fiscalYear,quarter:doc->>quarter,accessLevel:doc->>accessLevel';

// Paths of every file ref (`{ _ref: "file-..." }`) equal to assetId inside value.
function refPaths(value, assetId, path = '', out = []) {
  if (Array.isArray(value)) value.forEach((v, i) => refPaths(v, assetId, `${path}[${i}]`, out));
  else if (value && typeof value === 'object') {
    if (value._ref === assetId) out.push(path.replace(/\.asset$/, ''));
    for (const [k, v] of Object.entries(value)) refPaths(v, assetId, path ? `${path}.${k}` : k, out);
  }
  return out;
}

/**
 * Twin documents that reference assetId, limited to `types`.
 * Returns [{ id, type, field, visibility, isPublished, fiscalYear, quarter, accessLevel }],
 * one entry per (document, field). `field` is e.g. "generatedPdf" or
 * "commonRecommendationDocuments[2].file".
 */
export async function findFileReferences(assetId, types = [...Object.keys(SCALAR_FILE_FIELDS), ...SCANNED_TYPES]) {
  if (!isAssetId(assetId)) return [];
  const jobs = [];
  for (const type of types) {
    for (const field of SCALAR_FILE_FIELDS[type] || []) {
      jobs.push(
        supaAll(`/rest/v1/sanity_docs?select=${REPORT_SELECT}&type=${eq(type)}&doc->${field}->asset->>_ref=${eq(assetId)}`)
          .then((rows) => rows.map((r) => ({ ...r, field })))
      );
    }
    if (SCANNED_TYPES.includes(type)) {
      jobs.push(
        supaAll(`/rest/v1/sanity_docs?select=id,type,doc&type=${eq(type)}`).then((rows) =>
          rows.flatMap((r) => refPaths(r.doc, assetId).map((field) => ({ id: r.id, type: r.type, field })))
        )
      );
    }
  }
  return (await Promise.all(jobs)).flat().filter((r) => isPublishedId(r.id));
}

// lpQuarterlyReport visibility, as the GROQ filters have it:
// published = visibility == "published" || (isPublished == true && !defined(visibility)).
export const isReportPublished = (r) =>
  r?.visibility === 'published' || (r?.isPublished === true && (r?.visibility === null || r?.visibility === undefined));
export const isReportVisible = (r, staff) => isReportPublished(r) || (staff && r?.visibility === 'internal');

// GROQ `order(fiscalYear desc, quarter desc)` on strings: plain code-unit order.
// Missing values sort last here (no current report lacks either; see the B3 notes).

/** The latest published lpQuarterlyReport: { id, generatedPdfRef } or null. */
export async function getLatestPublishedReport() {
  const rows = await supaAll(
    `/rest/v1/sanity_docs?select=${REPORT_SELECT},generatedPdfRef:doc->generatedPdf->asset->>_ref&type=${eq('lpQuarterlyReport')}`
  );
  const published = rows.filter((r) => isPublishedId(r.id) && isReportPublished(r));
  // Same pick as GROQ `order(fiscalYear desc, quarter desc)[0]` in getLatestLPReportForDataRoom:
  // input in _id order, missing values first under desc, ties by _id.
  published.sort((a, b) => cmpStr(String(a.id), String(b.id)));
  return order(published, [[(r) => r.fiscalYear, 'desc'], [(r) => r.quarter, 'desc']])[0] || null;
}

/**
 * The portal user's file-access flags, resolved exactly as the pages resolve the
 * user: the data layer's getPortalUserByEmail (hosted-GROQ lower() on the stored
 * email, lowest _id wins, every row read through the doc loader), not a second
 * implementation.
 */
export async function getPortalUserFlags(email) {
  const u = await getPortalUserByEmail(email);
  return u ? { isGiftCityLP: u.isGiftCityLP === true, investorDataRoomAccess: u.investorDataRoomAccess === true } : null;
}

/** Data room authorisation, as the data room pages do it (same data layer lookups). */
export async function hasDataroomAccess(email) {
  if (!email) return false;
  if (isStaffEmail(email)) return true;
  const domain = email.split('@')[1];
  const [priv, user] = await Promise.all([
    domain ? getDataroomDomainPrivilege(domain) : null,
    getPortalUserFlags(email),
  ]);
  return !!priv || !!user?.investorDataRoomAccess;
}

// ── Signed URLs ──────────────────────────────────────────────────────────────

/**
 * A download file name from `?dl=`: no path separators, control characters or
 * quotes, at most 150 characters, always ending in `.pdf`. Returns null if
 * nothing usable is left.
 */
export function sanitizeDownloadName(raw) {
  if (typeof raw !== 'string') return null;
  let name = raw
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, '')
    .replace(/[/\\]/g, '')
    .replace(/["]/g, '')
    .trim();
  if (/\.pdf$/i.test(name)) name = name.slice(0, -4);
  name = name.replace(/^\.+/, '').trim();
  if (!name) return null;
  const base = Array.from(name).slice(0, DOWNLOAD_NAME_MAX - 4).join('').trim();
  return `${base}.pdf`;
}

/**
 * A signed URL for an object in the sanity-files bucket, valid 600 seconds.
 * With downloadName, the URL serves the file as an attachment with that name.
 */
export async function createSignedFileUrl(storagePath, { downloadName } = {}) {
  const { url } = config();
  const objectPath = storagePath.split('/').map(encodeURIComponent).join('/');
  const res = await supa(`/storage/v1/object/sign/${BUCKET}/${objectPath}`, {
    method: 'POST',
    body: { expiresIn: SIGNED_URL_SECONDS },
  });
  const signed = res?.signedURL || res?.signedUrl;
  if (!signed) throw new Error('Supabase sign: no signed URL returned');
  const full = new URL(`${url}/storage/v1${signed.startsWith('/') ? '' : '/'}${signed}`);
  if (downloadName) full.searchParams.set('download', downloadName);
  return full.toString();
}

// ── Route handler ────────────────────────────────────────────────────────────

const NO_STORE = { 'Cache-Control': 'no-store' };
const notFound = () => new NextResponse('Not found', { status: 404, headers: NO_STORE });

const SCOPES = {
  portal: { cookie: 'portal-session', prefix: '/partners', hostPrefixes: ['partners.', 'partners-'] },
  dataroom: { cookie: 'dataroom-session', prefix: '/dataroom', hostPrefixes: ['dataroom.', 'dataroom-'] },
};

// Same target the proxy uses: /sign-in on the scope's own host, /<prefix>/sign-in elsewhere (local dev).
function signInRedirect(request, scope) {
  const host = request.headers.get('host') || '';
  const { prefix, hostPrefixes } = SCOPES[scope];
  const onOwnHost = hostPrefixes.some((p) => host.startsWith(p));
  const res = NextResponse.redirect(new URL(onOwnHost ? '/sign-in' : `${prefix}/sign-in`, request.url));
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

async function portalAllows(email, refs) {
  const staff = isStaffEmail(email);
  const reports = refs.filter((r) => r.type === 'lpQuarterlyReport' && isReportVisible(r, staff));
  if (reports.some((r) => r.field !== 'giftCityFundFinancialsPdf')) return true;
  if (!reports.length) return false;
  if (staff) return true;
  return (await getPortalUserFlags(email))?.isGiftCityLP === true;
}

async function dataroomAllows(assetId, refs) {
  if (refs.some((r) => r.type === 'dataRoomDocument' && r.accessLevel === 'data-room')) return true;
  if (refs.some((r) => r.type === 'dataroomFundContent')) return true;
  if (!refs.some((r) => r.type === 'lpQuarterlyReport' && r.field === 'generatedPdf')) return false;
  return (await getLatestPublishedReport())?.generatedPdfRef === assetId;
}

/**
 * GET handler body for /partners/file/<assetId> (scope 'portal') and
 * /dataroom/file/<assetId> (scope 'dataroom').
 */
export async function handleFileRequest(request, assetId, scope) {
  const { cookie } = SCOPES[scope];
  const email = verifySession(request.cookies.get(cookie)?.value, scope);
  if (!email) return signInRedirect(request, scope);

  try {
    if (scope === 'dataroom' && !(await hasDataroomAccess(email))) return signInRedirect(request, scope);
    if (!isAssetId(assetId)) return notFound();

    const types = scope === 'portal' ? ['lpQuarterlyReport'] : ['lpQuarterlyReport', 'dataRoomDocument', 'dataroomFundContent'];
    const [asset, refs] = await Promise.all([getFileAsset(assetId), findFileReferences(assetId, types)]);
    if (!asset || !refs.length) return notFound();

    const allowed = scope === 'portal' ? await portalAllows(email, refs) : await dataroomAllows(assetId, refs);
    if (!allowed) return notFound();

    const dl = request.nextUrl.searchParams.get('dl');
    // `?dl=` with no name downloads under the original file name, as Sanity's CDN does.
    const downloadName =
      dl === null ? undefined : sanitizeDownloadName(dl) || sanitizeDownloadName(asset.originalFilename || '') || `${assetId}.pdf`;

    const signedUrl = await createSignedFileUrl(asset.storagePath, { downloadName });
    return new NextResponse(null, { status: 302, headers: { Location: signedUrl, ...NO_STORE } });
  } catch (err) {
    console.error(`[files] ${scope} file lookup failed: ${err.message}`);
    return new NextResponse('File temporarily unavailable', { status: 502, headers: NO_STORE });
  }
}
