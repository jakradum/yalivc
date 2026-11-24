// Fund II render data: the deck fixture plus the photo and logo URLs that the app's Sanity loader
// (src/decks/data/mapFromSanity.js) adds at runtime. Reads Sanity with the read token from .env.local.
// usage (from the repo root): node scripts/deck-render/fund2-data.mjs <out.json>
import fs from 'node:fs';

const API = 'https://nt0wmty3.api.sanity.io/v2024-01-01/data/query/production';
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=') && !l.startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^"|"$/g, '')]));
const TOKEN = env.SANITY_READ_TOKEN || env.SANITY_API_TOKEN;
const q = async (query) => (await (await fetch(`${API}?query=${encodeURIComponent(query)}&perspective=published`, { headers: { Authorization: `Bearer ${TOKEN}` } })).json()).result;

const d = JSON.parse(fs.readFileSync('src/decks/data/fixtures/fund-ii.json', 'utf8'));
const [team, companies, investors] = await Promise.all([
  q('*[_type == "teamMember" && profileType != "group"]{ name, "photoUrl": photo.asset->url }'),
  q('*[_type == "company"]{ name, "logoUrl": logo.asset->url }'),
  q(`*[_type == "investor" && name in ${JSON.stringify(d.lpLogos.names)}]{ name, "logoUrl": logo.asset->url }`),
]);

// same matching as mapFromSanity: nickname-stripped first names; deck display names map to Sanity names
const plain = (n) => n.replace(/\s*'[^']*'\s*/g, ' ').replace(/\s+/g, ' ').trim();
const MATCH = { Gani: 'Ganapathy' };
const photo = (name) => {
  const first = MATCH[name] || name.split(' ')[0];
  return team.find((m) => plain(m.name).startsWith(first))?.photoUrl || null;
};
for (const k of ['teamOverview', 'gpsAdvisor', 'investmentsTeam', 'operationsTeam']) d[k].people = d[k].people.map((p) => ({ ...p, photoUrl: photo(p.name) }));

const CO = { 'Perceptyne Robotics': 'Perceptyne', C2i: 'C2i Semiconductors', Deeplase: 'DeepLase' };
const logo = Object.fromEntries(companies.map((c) => [CO[c.name] || c.name, c.logoUrl]));
for (const r of d.fundIPortfolio.rows) r.logoUrl = logo[r.name] || null;
for (const c of d.appendixPortfolio.companies) c.logoUrl = logo[c.name] || null;
d.lpLogos.logos = d.lpLogos.names.map((n) => investors.find((i) => i.name === n)).filter(Boolean);

const missing = [...['teamOverview', 'gpsAdvisor', 'investmentsTeam', 'operationsTeam'].flatMap((k) => d[k].people.filter((p) => !p.photoUrl).map((p) => p.name)),
  ...d.fundIPortfolio.rows.filter((r) => !r.logoUrl).map((r) => r.name)];
fs.writeFileSync(process.argv[2], JSON.stringify(d));
console.log(`wrote ${process.argv[2]}; LP logos ${d.lpLogos.logos.length}/${d.lpLogos.names.length}; missing images: ${missing.join(', ') || 'none'}`);
