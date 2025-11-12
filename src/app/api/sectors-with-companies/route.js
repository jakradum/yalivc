import { getCompanies } from '@/lib/sanity-queries';
import { client } from '@/sanity/client';

export async function GET() {
  try {
    const sectors = await client.fetch(`
      *[_type == "sector" && published == true] {
        _id,
        name,
        "slug": slug.current,
        "categoryName": category->name
      }
    `);

    const companies = await getCompanies();
    
    const categoriesWithCompanies = new Set(
      companies.map(c => c.category).filter(Boolean)
    );

    const sectorsWithCompanies = sectors.filter(sector =>
      categoriesWithCompanies.has(sector.categoryName)
    );

    return Response.json({
      slugs: sectorsWithCompanies.map(s => s.slug)
    });
  } catch (error) {
    console.error('Failed to fetch sectors:', error);
    return Response.json({ slugs: [] });
  }
}