/**
 * Test script to verify Sanity write permissions
 * Run with: node scripts/test-sanity-write.js
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

async function testWrite() {
  console.log('Testing Sanity write permissions...\n');
  console.log('Project ID:', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3');
  console.log('Dataset:', process.env.NEXT_PUBLIC_SANITY_DATASET || 'production');
  console.log('Token exists:', !!process.env.SANITY_WRITE_TOKEN);
  console.log('Token length:', process.env.SANITY_WRITE_TOKEN?.length || 0);
  console.log('');

  // Test 1: Try to create a feedback document
  console.log('Test 1: Creating lpPortalFeedback document...');
  try {
    const feedbackDoc = await client.create({
      _type: 'lpPortalFeedback',
      email: 'test@yali.vc',
      npsScore: 10,
      reportQuarter: 'TEST - DELETE ME',
      feedbackDetails: 'This is a test feedback - please delete',
      submittedAt: new Date().toISOString(),
    });
    console.log('✅ SUCCESS! Created feedback document:', feedbackDoc._id);

    // Clean up - delete the test document
    console.log('Cleaning up test document...');
    await client.delete(feedbackDoc._id);
    console.log('✅ Deleted test document\n');
  } catch (error) {
    console.log('❌ FAILED to create feedback document');
    console.log('Error:', error.message);
    if (error.statusCode) console.log('Status code:', error.statusCode);
    console.log('');
  }

  // Test 2: Try to create a download consent document
  console.log('Test 2: Creating lpDownloadConsent document...');
  try {
    const consentDoc = await client.create({
      _type: 'lpDownloadConsent',
      email: 'test@yali.vc',
      downloadType: 'test',
      reportQuarter: 'TEST - DELETE ME',
      fileName: 'test.pdf',
      consentedAt: new Date().toISOString(),
      ipAddress: '127.0.0.1',
    });
    console.log('✅ SUCCESS! Created consent document:', consentDoc._id);

    // Clean up - delete the test document
    console.log('Cleaning up test document...');
    await client.delete(consentDoc._id);
    console.log('✅ Deleted test document\n');
  } catch (error) {
    console.log('❌ FAILED to create consent document');
    console.log('Error:', error.message);
    if (error.statusCode) console.log('Status code:', error.statusCode);
    console.log('');
  }

  console.log('Test complete!');
}

testWrite().catch(console.error);
