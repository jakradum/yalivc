// Migration script to upload JSON data to Sanity
// Run this once to migrate your data: node scripts/migrate-to-sanity.js

import { writeClient } from '../src/lib/sanity.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to read JSON files
function readJSON(filename) {
  const filePath = path.join(__dirname, '..', 'src', 'app', 'data', filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Migrate categories first (needed for company references)
async function migrateCategories() {
  console.log('📁 Migrating categories...');
  const data = readJSON('categories.json');
  const categories = data.investmentCategories || data.emergingTechnologies || [];
  
  for (let i = 0; i < categories.length; i++) {
    const category = typeof categories[i] === 'string' ? categories[i] : categories[i].name;
    const doc = {
      _type: 'category',
      name: category,
      slug: { current: category.toLowerCase().replace(/\s+/g, '-') },
      order: i
    };
    
    try {
      await writeClient.create(doc);
      console.log(`✅ Created category: ${category}`);
    } catch (error) {
      console.log(`⚠️  Category exists: ${category}`);
    }
  }
}

// Migrate companies
async function migrateCompanies() {
  console.log('🏢 Migrating companies...');
  const data = readJSON('companies.json');
  const companies = Array.isArray(data) ? data : Object.values(data).flat();
  
  // Get category IDs
  const categories = await writeClient.fetch(`*[_type == "category"]{_id, name}`);
  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.name.toLowerCase()] = cat._id;
  });
  
  for (const company of companies) {
    const categoryId = categoryMap[company.category?.toLowerCase()];
    
    if (!categoryId) {
      console.log(`⚠️  No category found for: ${company.name}`);
      continue;
    }
    
    const doc = {
      _type: 'company',
      name: company.name,
      category: { _type: 'reference', _ref: categoryId },
      oneLiner: company.oneLiner || company['one-liner'] || '',
      detail: company.detail || '',
      link: company.link || company.url || '',
      order: company.order || 0
    };
    
    try {
      await writeClient.create(doc);
      console.log(`✅ Created company: ${company.name}`);
    } catch (error) {
      console.log(`⚠️  Company exists: ${company.name}`);
    }
  }
}

// Migrate news
async function migrateNews() {
  console.log('📰 Migrating news...');
  const news = readJSON('news.json');
  
  for (const article of news) {
    const doc = {
      _type: 'news',
      url: article.url,
      date: article.date,
      publicationName: article.publication || article.publicationName,
      headlineEdited: article.headline || article.headlineEdited,
      isVideo: article.isVideo || false,
      featured: article.featured || false
    };
    
    try {
      await writeClient.create(doc);
      console.log(`✅ Created news: ${article.headline?.substring(0, 50)}...`);
    } catch (error) {
      console.log(`⚠️  News exists`);
    }
  }
}

// Migrate team members (non-core only)
async function migrateTeam() {
  console.log('👥 Migrating team members...');
  const team = readJSON('team.json');
  const teamMembers = team['Team Members'] || team;
  
  const coreMembers = ['gani', 'karthik', 'sunil', 'lip-bu', 'mathew'];
  
  for (let i = 0; i < teamMembers.length; i++) {
    const member = teamMembers[i];
    
    // Skip core members
    if (coreMembers.some(core => member.name.toLowerCase().includes(core))) {
      console.log(`⏭️  Skipping core member: ${member.name}`);
      continue;
    }
    
    const doc = {
      _type: 'teamMember',
      name: member.name,
      role: member.role || member.title,
      bio: member.bio || '',
      linkedIn: member.linkedin || member.linkedIn || '',
      order: i,
      status: 'active'
    };
    
    try {
      await writeClient.create(doc);
      console.log(`✅ Created team member: ${member.name}`);
    } catch (error) {
      console.log(`⚠️  Team member exists: ${member.name}`);
    }
  }
}

// Run migration
async function migrate() {
  console.log('🚀 Starting migration...\n');
  
  try {
    await migrateCategories();
    console.log('\n');
    await migrateCompanies();
    console.log('\n');
    await migrateNews();
    console.log('\n');
    await migrateTeam();
    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrate();