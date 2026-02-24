// Script to check if emails are in the newsletter subscriber list
// Run with: node scripts/check-newsletter-subscribers.js

import { client } from '../src/lib/sanity.js';

const emailsToCheck = [
  'pranavmain@gmail.com',
  'faisal.khan@sony.com',
  'anubhvjn@amazon.com',
  '5ivatej@proton.me',
  'xotomuhuc893@gmail.com',
  'ajay.apsoni@gmail.com',
  'aparna.bhalla16@gmail.com',
  'jobsvirendra@gmail.com',
  'simra.khan@successpact.com',
  'karan.bayad.c2024@iitbombay.org',
  'guravaiah@gmail.com',
  'boohay@zoho.com',
  'bhavya@krafton.com',
  'ajaypramod.cit@gmail.com',
  'pallavi@unicornivc.com',
  'ANKITMANTRI@HOTMAIL.COM',
];

async function checkNewsletterSubscribers() {
  console.log('🔍 Checking newsletter subscribers in Sanity...\n');

  try {
    // Fetch all newsletter subscribers
    const subscribers = await client.fetch(
      `*[_type == "newsletterSubscriber"] {
        _id,
        email,
        subscribedAt,
        source
      }`
    );

    console.log(`📊 Total subscribers in Sanity: ${subscribers.length}\n`);

    // Create a lowercase email map for faster lookup
    const subscriberMap = {};
    subscribers.forEach(sub => {
      subscriberMap[sub.email.toLowerCase()] = sub;
    });

    // Check each email
    const results = {
      found: [],
      notFound: [],
    };

    emailsToCheck.forEach(email => {
      const subscriber = subscriberMap[email.toLowerCase()];
      if (subscriber) {
        results.found.push({
          email,
          subscribedAt: subscriber.subscribedAt,
          source: subscriber.source,
        });
      } else {
        results.notFound.push(email);
      }
    });

    // Print results
    console.log('✅ FOUND IN SANITY:');
    console.log('═'.repeat(60));
    if (results.found.length > 0) {
      results.found.forEach(sub => {
        const date = sub.subscribedAt ? new Date(sub.subscribedAt).toLocaleDateString('en-IN') : 'N/A';
        console.log(`📧 ${sub.email}`);
        console.log(`   └─ Subscribed: ${date} | Source: ${sub.source || 'unknown'}`);
      });
    } else {
      console.log('   (None)');
    }

    console.log('\n❌ NOT FOUND IN SANITY:');
    console.log('═'.repeat(60));
    if (results.notFound.length > 0) {
      results.notFound.forEach(email => {
        console.log(`📧 ${email}`);
      });
    } else {
      console.log('   (All emails found!)');
    }

    console.log('\n📈 SUMMARY:');
    console.log('═'.repeat(60));
    console.log(`Found: ${results.found.length}/${emailsToCheck.length}`);
    console.log(`Missing: ${results.notFound.length}/${emailsToCheck.length}`);

  } catch (error) {
    console.error('❌ Error fetching from Sanity:', error);
  }
}

checkNewsletterSubscribers();
