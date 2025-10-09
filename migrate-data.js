// Run with: node migrate-data.js
import 'dotenv/config'
import {createClient} from '@sanity/client'
import categoriesData from './src/app/data/categories.json' with { type: 'json' }
import companiesData from './src/app/data/companies.json' with { type: 'json' }
import newsData from './src/app/data/news.json' with { type: 'json' }
import teamData from './src/app/data/team.json' with { type: 'json' }

const client = createClient({
  projectId: 'nt0wmty3',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_AUTH_TOKEN // Get this from Sanity dashboard
})

// Core team members to SKIP (they stay hardcoded)
const CORE_TEAM_NAMES = [
  "Ganapathy 'Gani' Subramaniam",
  "Karthikeyan 'Karthik' Madathil",
  "Mathew Cyriac",
  "Lip-Bu Tan",
  "Sunil S Patil"
]

async function migrateCategories() {
  console.log('📂 Migrating Categories...')
  const categories = categoriesData.emergingTechnologies
  const categoryMap = {}
  
  for (const cat of categories) {
    const doc = {
      _type: 'category',
      name: cat,
      slug: {
        _type: 'slug',
        current: cat.toLowerCase().replace(/\s+/g, '-')
      },
      order: categories.indexOf(cat)
    }
    
    const result = await client.create(doc)
    categoryMap[cat.toLowerCase()] = result._id
    console.log(`✅ Created category: ${cat}`)
  }
  
  return categoryMap
}

async function migrateCompanies(categoryMap) {
  console.log('\n🏢 Migrating Companies...')
  
  for (const company of companiesData.data) {
    const categoryId = categoryMap[company.category.toLowerCase()]
    
    const doc = {
      _type: 'company',
      name: company.name,
      category: {
        _type: 'reference',
        _ref: categoryId
      },
      oneLiner: company.oneLiner,
      detail: company.detail,
      link: company.link || undefined,
      order: companiesData.data.indexOf(company)
    }
    
    await client.create(doc)
    console.log(`✅ Created company: ${company.name}`)
  }
}

async function migrateNews() {
  console.log('\n📰 Migrating News Articles...')
  
  for (const article of newsData.data.articles) {
    const doc = {
      _type: 'news',
      url: article.url,
      date: article.date.split('T')[0], // Convert to YYYY-MM-DD
      publicationName: article.publicationName,
      headlineEdited: article.headlineEdited,
      isVideo: article.isVideo || false,
      featured: false
    }
    
    await client.create(doc)
    console.log(`✅ Created news: ${article.headlineEdited.substring(0, 50)}...`)
  }
}

async function migrateTeam() {
  console.log('\n👥 Migrating Team Members...')
  console.log(`ℹ️  Skipping core team (${CORE_TEAM_NAMES.length} members hardcoded)`)
  
  const teamMembers = teamData['Team Members']
  const nonCoreMembers = teamMembers.filter(
    member => !CORE_TEAM_NAMES.includes(member.Name)
  )
  
  if (nonCoreMembers.length === 0) {
    console.log('ℹ️  No non-core team members to migrate')
    return
  }
  
  for (const member of nonCoreMembers) {
    const doc = {
      _type: 'teamMember',
      name: member.Name,
      role: member.Designation,
      bio: member.Detailed || member['One-Liner'],
      linkedIn: member.linkedin || undefined,
      order: member.Order,
      status: 'active'
    }
    
    await client.create(doc)
    console.log(`✅ Created team member: ${member.Name}`)
  }
}

async function migrate() {
  try {
    console.log('🚀 Starting Sanity data migration...\n')
    
    // Step 1: Categories (needed for company references)
    const categoryMap = await migrateCategories()
    
    // Step 2: Companies
    await migrateCompanies(categoryMap)
    
    // Step 3: News
    await migrateNews()
    
    // Step 4: Team (non-core only)
    await migrateTeam()
    
    console.log('\n✨ Migration complete!')
    console.log('\n📌 Next steps:')
    console.log('1. Upload company logos manually in Sanity Console')
    console.log('2. Upload team member photos manually in Sanity Console')
    console.log('3. Verify all data in Console at http://localhost:3333/console')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

migrate()