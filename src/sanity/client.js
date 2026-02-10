import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
});

// Live client without CDN caching - use for LP portal and other real-time queries
export const liveClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
});

const builder = imageUrlBuilder(client);
export const urlFor = (source) => builder.image(source);

// ============ COMPANIES ============
export async function getCompanies() {
  const query = `*[_type == "company"] | order(order asc) {
    _id,
    name,
    oneLiner,
    detail,
    link,
    "category": category->name,
    "categorySlug": category->slug.current,
    "logo": logo.asset->url,
    order
  }`;
  return await client.fetch(query);
}

export async function getCompaniesByCategory(categorySlug) {
  const query = `*[_type == "company" && category->slug.current == $categorySlug] | order(order asc) {
    _id,
    name,
    oneLiner,
    detail,
    link,
    "logo": logo.asset->url,
    order
  }`;
  return await client.fetch(query, { categorySlug });
}

// ============ NEWS ============
export async function getNews(limit = 50) {
  const query = `*[_type == "news"] | order(date desc)[0...${limit}] {
    _id,
    url,
    date,
    headlineEdited,
    isVideo,
    featured,
    "publicationName": publication->name
  }`;
  return await client.fetch(query);
}

export async function getFeaturedNews() {
  const query = `*[_type == "news" && featured == true] | order(date desc) {
    _id,
    url,
    date,
    headlineEdited,
    isVideo,
    "publicationName": publication->name
  }`;
  return await client.fetch(query);
}

// ============ TEAM ============
export async function getTeamMembers() {
  const query = `*[_type == "teamMember" && status == "active"] | order(order asc) {
    _id,
    name,
    role,
    bio,
    "photo": photo.asset->url,
    linkedIn,
    order
  }`;
  return await client.fetch(query);
}

// ============ CATEGORIES ============
export async function getCategories() {
  const query = `*[_type == "category"] | order(order asc) {
    _id,
    name,
    "slug": slug.current,
    description,
    order
  }`;
  return await client.fetch(query);
}

export async function getCategoryBySlug(slug) {
  const query = `*[_type == "category" && slug.current == $slug][0] {
    _id,
    name,
    "slug": slug.current,
    description
  }`;
  return await client.fetch(query, { slug });
}

// ============ BLOG POSTS ============
export async function getBlogPosts() {
  const query = `*[_type == "blogPost" && status == "published"] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    blurb,
    featuredImage,
    publishedAt,
    readTime,
    "author": author->name
  }`;
  return await client.fetch(query);
}

export async function getBlogPost(slug) {
  const query = `*[_type == "blogPost" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    blurb,
    body,
    featuredImage,
    publishedAt,
    readTime,
    "author": author->{name, role, photo}
  }`;
  return await client.fetch(query, { slug });
}

// ============ QUARTERLY REPORTS ============
export async function getQuarterlyReports() {
  const query = `*[_type == "quarterlyReport" && publishStatus == "published"] | order(year desc, quarter desc) {
    _id,
    title,
    quarter,
    year,
    "pdfUrl": pdfFile.asset->url,
    publishedAt
  }`;
  return await client.fetch(query);
}

// ============ APPLICATIONS ============
export async function createApplication(data) {
  const doc = {
    _type: 'application',
    fullName: data.fullName,
    email: data.email,
    companyName: data.companyName,
    pitch: data.pitch,
    submittedAt: new Date().toISOString(),
    status: 'new',
    lastUpdatedAt: new Date().toISOString(),
  };

  return await client.create(doc);
}
