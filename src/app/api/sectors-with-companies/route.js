import { client } from '@/sanity/client';

export async function GET() {
  try {
    const categories = await client.fetch(`
      *[_type == "category"] | order(order asc) {
        name,
        "slug": slug.current
      }
    `);

    return Response.json({ categories });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return Response.json({ categories: [] });
  }
}