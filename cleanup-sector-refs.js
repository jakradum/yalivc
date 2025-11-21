import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'nt0wmty3',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: 'skIJoHgLETqSSL0CL5LUP1lpWOkFjLeX3OR7KuzUXb81nAiAYwIAJewbFpAbJ7ZpZ1CQfviS8bq24zs9IzHmHNu0FcoMJnpje8XeYU29sX37LqD2xbtXyV2gekueQoN0Fj5g9rc5yilZDg9Z0qedaVpqBxyLS1mHmxP9uWAOc42CQvSMtgF5',
  useCdn: false,
});

async function cleanup() {
  // Remove relatedSectors field from all news
  const news = await client.fetch(`*[_type == "news" && defined(relatedSectors)]`);
  for (const item of news) {
    await client.patch(item._id).unset(['relatedSectors']).commit();
    console.log(`✓ Cleaned news: ${item.headlineEdited}`);
  }

  // Remove sectors field from all blog posts
  const posts = await client.fetch(`*[_type == "blogPost" && defined(sectors)]`);
  for (const post of posts) {
    await client.patch(post._id).unset(['sectors']).commit();
    console.log(`✓ Cleaned blog: ${post.title}`);
  }
  
  console.log('Cleanup complete');
}

cleanup().catch(console.error);