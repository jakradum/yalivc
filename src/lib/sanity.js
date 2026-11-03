import { createClient } from 'next-sanity';

export const client = createClient({
  projectId: 'nt0wmty3',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false, // Set to true in production for better performance
  // Read token: the production dataset is private. Published docs only, so Studio
  // drafts never reach a page. (SANITY_READ_TOKEN is a Viewer token; falls back to
  // the existing API token until one is created.)
  token: process.env.SANITY_READ_TOKEN || process.env.SANITY_API_TOKEN,
  perspective: 'published',
});

// Client with token for writes (server-side only)
export const writeClient = createClient({
  projectId: 'nt0wmty3',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});
