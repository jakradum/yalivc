/**
 * Script to mark specified users as GIFT City LPs in Sanity
 * Run with: node scripts/mark-gift-city-lps.js
 */

import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

// List of emails to mark as GIFT City LPs
const giftCityEmails = [
  'mustafiz.r.choudhury@gmail.com',
  'vasunitya@yahoo.com',
  'nambiseshadri@gmail.com',
  'avinashmgupta@live.com',
  'mlstoklosa@yahoo.co.uk',
  'gillamarjit3@gmail.com',
  'Rishi.dani@gmail.com',
  'himanshu@1parikhs.com',
  'lbtan@waldenintl.com',
  'Mihir.worah@gmail.com',
  'shah@shahus.com',
  'shankar@waldencatalyst.com',
  'rushabh@runamcapital.com',
  'relouazzane@gmail.com',
  'cs@arohi.com',
  'edwardyao@etron.com.tw',
  'seseholdingsllc@gmail.com',
  'Bruce-MH.Yu@mediatek.com',
  'vamsi@dharana.com',
  'cndhruvfinances@gmail.com',
  'ameeshd@gmail.com',
  'Venus621@gmail.com',
  'Samir.mittal@gmail.com',
  'jkchung@miraeasset.com',
  'charlie.lee@miraeasset.com',
  'rangesh.raghavan@gmail.com',
  'aschwenk@qualcomm.com',
];

async function markGiftCityLPs() {
  console.log('Starting GIFT City LP marking process...\n');

  const results = {
    found: [],
    notFound: [],
    updated: [],
    alreadyMarked: [],
    errors: [],
  };

  for (const email of giftCityEmails) {
    const normalizedEmail = email.toLowerCase().trim();

    try {
      // Find user by email (case-insensitive)
      const user = await client.fetch(
        `*[_type == "portalUser" && lower(email) == $email][0]{ _id, email, name, isGiftCityLP }`,
        { email: normalizedEmail }
      );

      if (!user) {
        results.notFound.push(email);
        console.log(`❌ Not found: ${email}`);
        continue;
      }

      results.found.push({ email, id: user._id, name: user.name });

      if (user.isGiftCityLP === true) {
        results.alreadyMarked.push(email);
        console.log(`✓ Already marked: ${email} (${user.name || 'No name'})`);
        continue;
      }

      // Update user to mark as GIFT City LP
      await client
        .patch(user._id)
        .set({ isGiftCityLP: true })
        .commit();

      results.updated.push(email);
      console.log(`✅ Updated: ${email} (${user.name || 'No name'})`);

    } catch (error) {
      results.errors.push({ email, error: error.message });
      console.log(`⚠️ Error for ${email}: ${error.message}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total emails processed: ${giftCityEmails.length}`);
  console.log(`Found in Sanity: ${results.found.length}`);
  console.log(`Not found: ${results.notFound.length}`);
  console.log(`Updated: ${results.updated.length}`);
  console.log(`Already marked: ${results.alreadyMarked.length}`);
  console.log(`Errors: ${results.errors.length}`);

  if (results.notFound.length > 0) {
    console.log('\nEmails not found in Sanity:');
    results.notFound.forEach(e => console.log(`  - ${e}`));
  }

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(e => console.log(`  - ${e.email}: ${e.error}`));
  }
}

markGiftCityLPs().catch(console.error);
