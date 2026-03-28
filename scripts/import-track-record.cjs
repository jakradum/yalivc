/**
 * Import track record entries from CSV into Sanity.
 * Run: node scripts/import-track-record.cjs
 */
const fs = require('fs');
const path = require('path');

// Load .env.local
try {
  const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^[\"']|[\"']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

// Fix mojibake encoding from CSV (UTF-8 misread as Latin-1)
function fixEncoding(str) {
  if (!str) return str;
  return str
    .replace(/â¹/g, '₹')
    .replace(/â‚¬/g, '€')
    .trim();
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes;
    } else if (line[i] === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += line[i];
    }
  }
  result.push(current);
  return result;
}

async function run() {
  // Fetch all teamMembers to build name→_id map
  const teamMembers = await client.fetch(`*[_type == "teamMember"]{ _id, name, slug }`);
  console.log(`Found ${teamMembers.length} team members:`);
  teamMembers.forEach(m => console.log(`  ${m._id}  name="${m.name}"  slug="${m.slug?.current}"`));

  // Manual mapping from CSV investor key → teamMember _id
  // Adjust these after reviewing the output above
  const investorMap = {};
  for (const m of teamMembers) {
    const nameLower = (m.name || '').toLowerCase();
    const slug = (m.slug?.current || '').toLowerCase();
    if (nameLower.includes('gani') || slug.includes('gani')) investorMap['gani'] = m._id;
    if (nameLower.includes('mathew') || slug.includes('mathew') || nameLower.includes('mathews')) investorMap['mathew'] = m._id;
  }

  console.log('\nInvestor mapping:', investorMap);

  if (!investorMap['gani'] || !investorMap['mathew']) {
    console.error('\nERROR: Could not find all investors. Update the mapping manually above.');
    process.exit(1);
  }

  // Read CSV
  const csvPath = path.join(process.cwd(), 'scripts', 'track_record_import.csv');
  const lines = fs.readFileSync(csvPath, 'utf-8').split('\n').filter(Boolean);
  const headers = parseCSVLine(lines[0]);
  console.log('\nHeaders:', headers);

  const records = lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = values[i] ? values[i].trim() : ''; });
    return obj;
  }).filter(r => r.investeeName);

  console.log(`\nParsed ${records.length} records`);

  const tx = client.transaction();

  for (const r of records) {
    const investorId = investorMap[r.investor?.toLowerCase()];
    if (!investorId) {
      console.warn(`  Skipping "${r.investeeName}" — unknown investor "${r.investor}"`);
      continue;
    }

    const doc = {
      _type: 'trackRecord',
      investor: { _type: 'reference', _ref: investorId },
      investeeName: fixEncoding(r.investeeName),
      investmentOrg: fixEncoding(r.investmentOrg) || undefined,
      year: r.year ? parseInt(r.year) : undefined,
      sector: fixEncoding(r.sector) || undefined,
      amountInvested: fixEncoding(r.amountInvested) || undefined,
      status: r.status || undefined,
      exitYear: r.exitYear ? parseInt(r.exitYear) : undefined,
      exitAmountOrValuation: fixEncoding(r.exitAmountOrValuation) || undefined,
      irr: r.irr ? parseFloat(r.irr) : undefined,
    };

    // Remove undefined fields
    Object.keys(doc).forEach(k => doc[k] === undefined && delete doc[k]);

    console.log(`  + ${r.investor}: ${doc.investeeName} (${doc.status}, ${doc.year})`);
    tx.create(doc);
  }

  await tx.commit();
  console.log(`\nDone. ${records.length} track record entries imported.`);
}

run().catch(err => { console.error(err); process.exit(1); });
