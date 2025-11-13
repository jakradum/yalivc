import { client } from '@/sanity/client';

export async function GET() {
  try {
    const sectors = await client.fetch(`
      *[_type == "sector" && published == true] | order(order asc) {
        name,
        "slug": slug.current
      }
    `);

    return Response.json({ sectors });
  } catch (error) {
    console.error('Failed to fetch sectors:', error);
    return Response.json({ sectors: [] });
  }
}