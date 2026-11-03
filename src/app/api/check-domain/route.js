import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  // Read token: the production dataset is private. Published docs only, so Studio
  // drafts never reach a page. (SANITY_READ_TOKEN is a Viewer token; falls back to
  // the existing API token until one is created.)
  token: process.env.SANITY_READ_TOKEN || process.env.SANITY_API_TOKEN,
  perspective: 'published',
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain')?.toLowerCase().trim();

  if (!domain) {
    return NextResponse.json({ shared: false });
  }

  const result = await client.fetch(
    `*[_type == "domainPrivilege" && domain == $domain && requireCode == true && isActive == true][0]{ _id }`,
    { domain }
  );

  return NextResponse.json({ shared: !!result });
}
