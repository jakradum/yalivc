const { client } = require('./src/sanity/client');
const fs = require('fs');

async function exportNews() {
  const news = await client.fetch(`*[_type == "news"] | order(date desc) {
    _id,
    url,
    date,
    headlineEdited,
    isVideo,
    featured,
    "publicationName": publication->name,
    "publicationId": publication._ref,
    relatedSectors,
    relatedCompanies
  }`);
  
  const sectors = await client.fetch(`*[_type == "sector"]{ _id, name }`);
  const companies = await client.fetch(`*[_type == "company"]{ _id, name }`);
  
  fs.writeFileSync('news-export.json', JSON.stringify({ news, sectors, companies }, null, 2));
  console.log(`Exported ${news.length} articles to news-export.json`);
}

exportNews().catch(console.error);
