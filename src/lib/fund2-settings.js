// Fund II terms (target size, greenshoe, term, stage allocation, sectors) used by
// the decks and the creative tool. Not public, so the `fund2Settings` document
// lives in Supabase since 24 Nov 2026 (same shape as the old Sanity singleton);
// edits go through Claude. Sector references still point at public Sanity
// categories and are resolved to names here. Server-side only.
import { createClient } from '@sanity/client';
import { getDoc } from './private-docs.js';

const sanity = createClient({
  projectId: 'nt0wmty3', dataset: 'production', apiVersion: '2024-01-01', useCdn: true,
  token: process.env.SANITY_READ_TOKEN || process.env.SANITY_API_TOKEN,
  perspective: 'published',
});

// → { fundName, targetFundSizeINR, ..., deploymentStageAllocation, focusSectors: [name], adjacentSectors: [name] } or null
export async function getFund2Settings() {
  const f = await getDoc('fund2Settings');
  if (!f) return null;
  const refs = (list) => (list || []).map((r) => r?._ref).filter(Boolean);
  const ids = [...new Set([...refs(f.focusSectors), ...refs(f.adjacentSectors)])];
  const cats = ids.length ? await sanity.fetch('*[_id in $ids]{ _id, name }', { ids }) : [];
  const name = new Map(cats.map((c) => [c._id, c.name]));
  const names = (list) => refs(list).map((id) => name.get(id)).filter(Boolean);
  return {
    fundName: f.fundName ?? null,
    targetFundSizeINR: f.targetFundSizeINR ?? null,
    targetFundSizeUSD: f.targetFundSizeUSD ?? null,
    greenshoeINR: f.greenshoeINR ?? null,
    fundTerm: f.fundTerm ?? null,
    investmentPeriodYears: f.investmentPeriodYears ?? null,
    location: f.location ?? null,
    deploymentStageAllocation: (f.deploymentStageAllocation || []).map(({ stage, percent, note }) => ({ stage: stage ?? null, percent: percent ?? null, note: note ?? null })),
    focusSectors: names(f.focusSectors),
    adjacentSectors: names(f.adjacentSectors),
  };
}
