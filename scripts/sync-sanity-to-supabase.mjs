// Run one Sanity → Supabase twin sync from your machine (reads .env.local).
//   node scripts/sync-sanity-to-supabase.mjs          docs + PDFs + images
//   node scripts/sync-sanity-to-supabase.mjs --no-files
import { readFileSync } from 'node:fs';

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const i = line.indexOf('=');
  if (i > 0 && !process.env[line.slice(0, i).trim()]) process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}

const { syncTwin } = await import('../src/lib/supabase/twin.js');
const result = await syncTwin({ files: !process.argv.includes('--no-files'), log: (m) => console.log(m) });
if (result.skipped) console.log('skipped:', result.skipped);
else {
  console.log('counts (sanity / supabase):');
  for (const [type, c] of Object.entries(result.counts)) console.log(`  ${type.padEnd(28)} ${c.sanity} / ${c.supabase}`);
  if (result.disabledTypes.length) console.log('disabled (not touched):', result.disabledTypes.join(', '));
  console.log('done:', JSON.stringify({ docsTotal: result.docsTotal, docsUpserted: result.docsUpserted, docsDeleted: result.docsDeleted, assetsReferenced: result.assetsReferenced, filesUploaded: result.filesUploaded }));
}
