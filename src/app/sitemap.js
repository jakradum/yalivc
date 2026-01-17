import { getTeamMembers, getAllBlogPosts } from '@/lib/sanity-queries';

export default async function sitemap() {
  const baseUrl = 'https://yali.vc';

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/about-yali`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/investments`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/newsroom`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/investor-relations`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Dynamic team member pages
  let teamPages = [];
  try {
    const teamMembers = await getTeamMembers();
    teamPages = teamMembers
      .filter(member => member.slug?.current)
      .map((member) => ({
        url: `${baseUrl}/about-yali/${member.slug.current}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      }));
  } catch (error) {
    console.error('Error fetching team members for sitemap:', error);
  }

  // Dynamic blog posts
  let blogPages = [];
  try {
    const posts = await getAllBlogPosts();
    blogPages = posts
      .filter(post => post.slug)
      .map((post) => ({
        url: `${baseUrl}/insights/blog/${post.slug}`,
        lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      }));
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error);
  }

  return [...staticPages, ...teamPages, ...blogPages];
}
