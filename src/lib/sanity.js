import { createClient } from 'next-sanity';

export const client = createClient({
  projectId: 'nt0wmty3',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false, // Set to true in production for better performance
});

// Client with token for writes (server-side only)
export const writeClient = createClient({
  projectId: 'nt0wmty3',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});
