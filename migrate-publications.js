// Run with: node migrate-publications.js
import 'dotenv/config'
import {createClient} from '@sanity/client'

const client = createClient({
  projectId: 'nt0wmty3',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_AUTH_TOKEN
})

async function migratePublications() {
  try {
    console.log('🚀 Starting publication migration...\n')

    // Step 1: Get all existing news articles
    console.log('📰 Fetching existing news articles...')
    const newsArticles = await client.fetch(`*[_type == "news"] {
      _id,
      publicationName
    }`)
    console.log(`Found ${newsArticles.length} news articles`)

    // Step 2: Extract unique publication names
    const uniquePubs = [...new Set(newsArticles.map(a => a.publicationName))]
    console.log(`\n📚 Found ${uniquePubs.length} unique publications:`)
    uniquePubs.forEach(p => console.log(`  - ${p}`))

    // Step 3: Create publication documents
    console.log('\n📝 Creating publication documents...')
    const pubMap = {}
    
    for (const pubName of uniquePubs) {
      const doc = {
        _type: 'publication',
        name: pubName,
        slug: {
          _type: 'slug',
          current: pubName.toLowerCase().replace(/\s+/g, '-')
        }
      }
      
      const result = await client.create(doc)
      pubMap[pubName] = result._id
      console.log(`✅ Created: ${pubName}`)
    }

    // Step 4: Update news articles to use publication references
    console.log('\n🔄 Updating news articles...')
    
    for (const article of newsArticles) {
      const pubId = pubMap[article.publicationName]
      
      await client
        .patch(article._id)
        .set({
          publication: {
            _type: 'reference',
            _ref: pubId
          }
        })
        .unset(['publicationName']) // Remove old field
        .commit()
      
      console.log(`✅ Updated article: ${article._id}`)
    }

    console.log('\n✨ Migration complete!')
    console.log('\n📌 Next: Reload Sanity Console to see Publications section')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

migratePublications()