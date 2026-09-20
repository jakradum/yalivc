import { createClient } from '@sanity/client';

// Read-only facts the creative agent may look up in Sanity, so a post about a
// portfolio company starts from what Yali already says about it (and its real
// logo) instead of what the person happened to type.
//
// PUBLIC-SAFE FIELDS ONLY. Assets built here are public posts and emailers; the
// company records also hold LP-confidential numbers (amounts invested, FMV,
// MOIC, ownership). None of that is ever selected, so it cannot reach the model
// or end up on a card.
const client = createClient({ projectId: 'nt0wmty3', dataset: 'production', apiVersion: '2024-01-01', useCdn: false });

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const plain = (v) => {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map((b) => (b?.children || []).map((c) => c.text).join('')).join(' ');
  return '';
};

const COMPANY_FIELDS = `{
  name, "slug": slug.current, investmentStatus, oneLiner, detail,
  "sector": category->name, "website": link, "listedOnWebsite": showOnMainWebsite == true,
  "logo": logo.asset->{ _id, url, "w": metadata.dimensions.width, "h": metadata.dimensions.height }
}`;

const shape = (c) => ({
  name: c.name,
  slug: c.slug,
  sector: (c.sector || '').replace(/\band\b/gi, '&'),
  status: c.investmentStatus, // active | exited | written-off
  description: c.oneLiner || '',
  detail: plain(c.detail).slice(0, 600),
  website: c.website || null,
  // Yali lists this company on its public website. If false, only name it when the
  // request explicitly asks for it.
  listedOnWebsite: c.listedOnWebsite,
  hasLogo: !!c.logo,
});

export async function lookupCompany(query) {
  const q = norm(query);
  if (!q) return [];
  const all = await client.fetch(`*[_type == "company"] ${COMPANY_FIELDS}`);
  return all.filter((c) => norm(c.name).includes(q) || q.includes(norm(c.name)) || norm(c.slug) === q).map(shape);
}

// → a library entry for the studio's asset library (kind logo), or null.
export async function companyLogoAsset(slugOrName) {
  const q = norm(slugOrName);
  const all = await client.fetch(`*[_type == "company"] ${COMPANY_FIELDS}`);
  const c = all.find((x) => norm(x.slug) === q || norm(x.name) === q) || all.find((x) => norm(x.name).includes(q));
  if (!c?.logo?.url) return null;
  return {
    id: c.logo._id,
    company: c.name,
    asset: { url: c.logo.url, width: c.logo.w, height: c.logo.h, kind: 'logo', alt: `${c.name} logo`, noCrop: true, ground: 'light' },
  };
}

// Fund II terms. Each value carries the `source` string a stat block needs.
export async function fundFacts() {
  const f = await client.fetch(`*[_id == "fund2Settings"][0]{ fundName, targetFundSizeINR, targetFundSizeUSD, greenshoeINR, fundTerm, investmentPeriodYears, deploymentStageAllocation[]{ stage, percent }, "focusSectors": focusSectors[]->name, "adjacentSectors": adjacentSectors[]->name }`);
  if (!f) return null;
  const src = (k) => `sanity:fund2Settings.${k}`;
  return {
    fund: f.fundName,
    targetFundSizeINR: { value: f.targetFundSizeINR, unit: 'Crore', source: src('targetFundSizeINR') },
    targetFundSizeUSD: { value: f.targetFundSizeUSD, unit: 'million', source: src('targetFundSizeUSD') },
    greenshoeINR: { value: f.greenshoeINR, unit: 'Crore', source: src('greenshoeINR') },
    fundTerm: { value: f.fundTerm, source: src('fundTerm') },
    investmentPeriodYears: { value: f.investmentPeriodYears, source: src('investmentPeriodYears') },
    deploymentStageAllocation: { value: f.deploymentStageAllocation, source: src('deploymentStageAllocation') },
    focusSectors: f.focusSectors,
    adjacentSectors: f.adjacentSectors,
    note: 'Fund II terms only. Fund I performance figures are not available to you and must never appear in public assets.',
  };
}
