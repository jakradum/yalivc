import { getCompanies, getSectors } from '@/lib/sanity-queries';

export async function GET() {
  try {
    const [sectors, companies] = await Promise.all([
      getSectors(),
      getCompanies()
    ]);

    console.log('Companies:', companies.length);
    console.log('Sample company:', companies[0]);
    
    const categoriesWithCompanies = new Set();
    
    companies.forEach(company => {
      if (company.category) categoriesWithCompanies.add(company.category);
      if (company.categories) {
        if (Array.isArray(company.categories)) {
          company.categories.forEach(cat => {
            if (typeof cat === 'string') categoriesWithCompanies.add(cat);
            if (cat?.slug) categoriesWithCompanies.add(cat.slug);
            if (cat?.slug?.current) categoriesWithCompanies.add(cat.slug.current);
          });
        }
      }
    });

    console.log('Categories found:', Array.from(categoriesWithCompanies));

    const sectorsWithCompanies = sectors.filter(sector => 
      categoriesWithCompanies.has(sector.slug.current)
    );

    return Response.json({
      slugs: sectorsWithCompanies.map(s => s.slug.current)
    });
  } catch (error) {
    console.error('Failed to fetch sectors with companies:', error);
    return Response.json({ slugs: [] });
  }
}