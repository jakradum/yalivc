/**
 * One-time script: import 78 new dataroom portalUser records
 * Run from project root: node scripts/import-dataroom-users.js
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
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
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

const NEW_USERS = [
  { name: 'Micron Ventures', email: 'abyrnes@micron.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Aditya Joshi', email: 'aditya.joshi@brookfield.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Evolvence India Fund IV Ltd', email: 'ajit@evolvence.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Ameesh Divatia', email: 'ameesh@baffle.io', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Amit Jain', email: 'amit.jain@carlyle.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Amarjit Gill', email: 'amit@outforce.net', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Anthony Weldon', email: 'anthonyweldon@denlow.org', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Founders Collective Fund', email: 'ashish@mkventurescapital.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'SAG Capital LLC', email: 'ashuawasthi@gmail.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Krishna (UST)', email: 'bkprasad@yahoo.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Chirag Negandhi', email: 'chirag.negandhi@jmfl.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Chirag Dhruv', email: 'cndhruv@gmail.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'SIDBI', email: 'crisil_rishabhg@sidbi.in', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Etron Technology Inc', email: 'daffyteo@gmail.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Catamaran Ventures LLP', email: 'deepak@catamaran.in', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'David Goel', email: 'dgoel@matrixlp.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Foxconn', email: 'eddie.ty.chuang@foxconn.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Foxconn', email: 'eric.yy.liang@foxconn.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Francis De Souza', email: 'fdesouza100@gmail.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Naveneet CEO Sunil', email: 'gala@navneet.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'SIDBI', email: 'gautam@sidbi.in', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Gopal Srinivasan', email: 'gopal.srinivasan@tvscapital.in', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'SAG Capital LLC', email: 'gurpreet@micron.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Jindal Poly Films Limited', email: 'head.treasury@jindalgroup.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Himanshu Jain', email: 'hijain@gmail.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Foxconn', email: 'james.mh.tu@foxconn.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'VantageBio Limited', email: 'jeremy.wang@etron.com.tw', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Jason Trachewsky (Pleno)', email: 'jtrachewsky@gmail.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Karan Bhagat and Shilpa Bhagat', email: 'karan@360.one', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Digimoc Holdings Limited', email: 'katty.chang@mediatek.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'DSP Adiko Holdings Pvt ltd', email: 'kbajaj.advisor@dspinvest.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'ROHM ventures', email: 'koji.taniuchi@dsn.rohm.co.jp', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Krishna (PIMCO)', email: 'krishna3@gmail.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Premji Capital', email: 'kurien@premjiinvest.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Digimoc Holdings Limited', email: 'lawrence.loh@mediatek.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: '2015 Grover Family Trust', email: 'mahesh_idnani@cms.co.in', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Monique Reichenstein', email: 'moniquereichenstein@nypl.org', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Deep6 Management Service LLP', email: 'muthu@zaikenn.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Narender Nagpal', email: 'nagpalnarender@gmail.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Utpal Hemendra Sheth', email: 'navin.jain@trustgroup.in', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'ROHM ventures', email: 'nobuhiro.hase@dsn.rohm.co.jp', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'OM (AMD CTO)', email: 'om_nalamasu@amat.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Anthony Weldon', email: 'philip@denlow.org', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Pieter van Rooyen (Pleno)', email: 'pieter@plenoinc.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'PK', email: 'pk@aptener.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Chaitanya Trust', email: 'poddargaurav@gmail.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'SAG Capital LLC', email: 'prashant.parekh@klouddata.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Qualcomm Ventures', email: 'qli@qti.qualcomm.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Gopal Srinivasan', email: 'r.jagannathan@tvscapital.in', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Great Eastern CEO Ravi', email: 'rahul_sheth@greatship.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'SIDBI', email: 'rajatj@sidbi.in', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Shah Mars LLC', email: 'rajesh.shah@softnautics.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Rajiv Ashok Agrawal', email: 'rajiv.agrawal@jmfl.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Micron Ventures', email: 'rhartner@micron.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Raj Neervannan (Alphasense CTO)', email: 'rneervannan@gmail.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Rahul Singh', email: 'ruchika.banthia@ideaforgetech.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Nippon', email: 'sachin.bid@nipponindiaim.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'SAG Capital LLC', email: 'samir@micron.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Sandeep Jain', email: 'sandeep.jain@jmfl.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Sanjay Mehrotra', email: 'sanjaysandisk@gmail.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Shajikumar Devakar', email: 'shaji.kumar@360.one', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Shankar Siva', email: 'shankarsiva20@yahoo.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Pratithi-Kris Gopal Office', email: 'sheeba@pratithi.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'SIDBI', email: 'singhsp@sidbi.in', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Shashi Kiran Shetty & Arathi Shetty', email: 'skshetty@allcargologistics.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Siva - Western Digital', email: 'ssivaram@quantumscape.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Sumit Sadhana', email: 'sumit@micron.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Gopal Srinivasan', email: 'surabhi@surabhi.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Founders Collective Fund', email: 'suyash.kela@singularityholdings.vc', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'ROHM ventures', email: 'takeshi.washiyama@sal.rohm.co.jp', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Selenium Trust', email: 'vacharya@vmsbgoa.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Vallabh Roopchand Bhanshali', email: 'vallabh@enam.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Venkat', email: 'venkat@anvayaventures.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'JM Financial Products Limited', email: 'vishal.kampani@jmfl.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Vishal Saxena', email: 'vishal.saxena@ideaforgetech.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Utpal Hemendra Sheth', email: 'vishesh.dalal@trustgroup.in', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
  { name: 'Yusuf Jamal (Skyworks)', email: 'yjamal@protonmail.com', isActive: false, dataRoomAccess: true, isGiftCityLP: true, source: 'dataroom' },
  { name: 'Zentrico Ventures', email: 'yogesh@xyxxcrew.com', isActive: false, dataRoomAccess: true, isGiftCityLP: false, source: 'dataroom' },
];

async function run() {
  // 1. Get existing emails
  const existing = await client.fetch(`*[_type == "portalUser"].email`);
  const existingSet = new Set(existing.map(e => e?.toLowerCase().trim()).filter(Boolean));
  console.log(`Existing users: ${existingSet.size}`);

  // 2. Filter out duplicates
  const toImport = NEW_USERS.filter(u => !existingSet.has(u.email.toLowerCase().trim()));
  const skipped = NEW_USERS.filter(u => existingSet.has(u.email.toLowerCase().trim()));

  if (skipped.length > 0) {
    console.log(`\nSkipping ${skipped.length} duplicate(s):`);
    skipped.forEach(u => console.log(`  - ${u.email}`));
  }

  if (toImport.length === 0) {
    console.log('\nNo new users to import.');
    return;
  }

  // 3. Import in batches of 50
  console.log(`\nImporting ${toImport.length} new users...`);
  const BATCH = 50;
  for (let i = 0; i < toImport.length; i += BATCH) {
    const batch = toImport.slice(i, i + BATCH);
    const tx = client.transaction();
    for (const u of batch) {
      tx.create({
        _type: 'portalUser',
        email: u.email.toLowerCase().trim(),
        name: u.name,
        isActive: u.isActive,
        isGiftCityLP: u.isGiftCityLP,
        dataRoomAccess: u.dataRoomAccess,
        source: u.source,
      });
    }
    await tx.commit();
    console.log(`  Batch ${Math.floor(i / BATCH) + 1}: imported ${batch.length} records`);
  }

  console.log(`\nDone. Imported ${toImport.length} users.`);
}

run().catch(err => { console.error(err); process.exit(1); });
