const { client } = require('./src/sanity/client');

// Fetch all data
async function tagNews() {
  const news = await client.fetch(`*[_type == "news"]{ _id, headlineEdited, date, url }`);
  const sectors = await client.fetch(`*[_type == "sector"]{ _id, name, slug }`);
  const companies = await client.fetch(`*[_type == "company"]{ _id, name, slug }`);
  
  console.log(`Found ${news.length} news articles`);
  
  // Auto-tag based on keyword matching
  for (const article of news) {
    const headline = article.headlineEdited.toLowerCase();
    const sectorMatches = [];
    const companyMatches = [];
    
    // Match sectors
    sectors.forEach(sector => {
      if (headline.includes(sector.name.toLowerCase())) {
        sectorMatches.push({ _type: 'reference', _ref: sector._id });
      }
    });
    
    // Match companies
    companies.forEach(company => {
      if (headline.includes(company.name.toLowerCase())) {
        companyMatches.push({ _type: 'reference', _ref: company._id });
      }
    });
    
    // Only update if we found matches
    if (sectorMatches.length > 0 || companyMatches.length > 0) {
      console.log(`\nTagging: ${article.headlineEdited}`);
      console.log(`  Sectors: ${sectorMatches.length}, Companies: ${companyMatches.length}`);
      
      await client.patch(article._id)
        .set({ 
          relatedSectors: sectorMatches,
          relatedCompanies: companyMatches 
        })
        .commit();
    }
  }
  
  console.log('\nDone tagging!');
}

tagNews().catch(console.error);
