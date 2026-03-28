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

// Structured money data keyed by investeeName
// currency: 'USD' | 'INR', value: number in base units (e.g. 5000000 for $5M / ₹50L)
const moneyData = {
  'Agnikul Cosmos':                  { amountInvested: { currency: 'USD', value: 5000000 },   exitAmountOrValuation: { currency: 'USD', value: 5000000 } },
  'Ideaforge Technologies':          { amountInvested: { currency: 'INR', value: 485000000 },  exitAmountOrValuation: { currency: 'INR', value: 743000000 } },
  'Tonbo Imaging Pte/ Tonbo India Pvt. Ltd.': { amountInvested: { currency: 'USD', value: 7000000 }, exitAmountOrValuation: { currency: 'USD', value: 13000000 } },
  'Aura Semi-Conductors':            { amountInvested: { currency: 'INR', value: 430000000 },  exitAmountOrValuation: { currency: 'INR', value: 900000000 } },
  'Kyulux Japan':                    { amountInvested: { currency: 'INR', value: 600000000 },  exitAmountOrValuation: { currency: 'INR', value: 1200000000 } },
  'Cosmic Circuits':                 { amountInvested: { currency: 'INR', value: 1200000 },    exitAmountOrValuation: { currency: 'INR', value: 600000000 } },
  'Cirel Systems':                   { amountInvested: { currency: 'INR', value: 30000000 },   exitAmountOrValuation: { currency: 'INR', value: 270000000 } },
  'NanoSemi':                        { amountInvested: { currency: 'USD', value: 75000 },      exitAmountOrValuation: { currency: 'USD', value: 343867 } },
  'Haystack Analytics':              { amountInvested: { currency: 'INR', value: 2500000 },    exitAmountOrValuation: { currency: 'INR', value: 12700000 } },
  'Ethereal Machines':               { amountInvested: { currency: 'INR', value: 80000000 },   exitAmountOrValuation: { currency: 'INR', value: 230000000 } },
  'Galaxeye':                        { amountInvested: { currency: 'INR', value: 2500000 },    exitAmountOrValuation: { currency: 'INR', value: 10000000 } },
  'Data Patterns':                   { amountInvested: { currency: 'INR', value: 530000000 },  exitAmountOrValuation: { currency: 'INR', value: 9000000000 } },
  'MTAR Technologies Limited':       { amountInvested: { currency: 'INR', value: 360000000 },  exitAmountOrValuation: { currency: 'INR', value: 9000000000 } },
  'Ideaforge Technologies Limited':  { amountInvested: { currency: 'INR', value: 930000000 },  exitAmountOrValuation: { currency: 'INR', value: 2700000000 } },
  'Gokaldas Exports Limited':        { amountInvested: { currency: 'INR', value: 590000000 },  exitAmountOrValuation: { currency: 'INR', value: 2870000000 } },
};

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

    const money = moneyData[r.investeeName] || {};

    const doc = {
      _type: 'trackRecord',
      investor: { _type: 'reference', _ref: investorId },
      investeeName: r.investeeName,
      investmentOrg: r.investmentOrg || undefined,
      year: r.year ? parseInt(r.year) : undefined,
      sector: r.sector || undefined,
      amountInvested: money.amountInvested,
      status: r.status || undefined,
      exitYear: r.exitYear ? parseInt(r.exitYear) : undefined,
      exitAmountOrValuation: money.exitAmountOrValuation,
      irr: r.irr ? parseFloat(r.irr) : undefined,
    };

    // Remove undefined fields
    Object.keys(doc).forEach(k => doc[k] === undefined && delete doc[k]);

    console.log(`  + ${r.investor}: ${doc.investeeName} (${doc.status}, ${doc.year}) | invested: ${JSON.stringify(doc.amountInvested)}`);
    tx.create(doc);
  }

  await tx.commit();
  console.log(`\nDone. ${records.length} track record entries imported.`);
}

run().catch(err => { console.error(err); process.exit(1); });
