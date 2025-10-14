import { client } from './sanity.js';

// Fetch all companies
export async function getCompanies() {
  const query = `*[_type == "company"] | order(order asc) {
    _id,
    name,
    "category": category->name,
    oneLiner,
    detail,
    link,
    "logo": logo.asset->url,
    order
  }`;
  return await client.fetch(query);
}

// Fetch all news articles
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

export async function getTeamMembers() {
  return client.fetch(`
    *[_type == "teamMember" && status == "active"] | order(order asc) {
      name,
      role,
      oneLiner,
      bio,
      "photo": photo.asset->url,
      linkedIn
    }
  `);
}


// Fetch all categories
export async function getCategories() {
  const query = `*[_type == "category"] | order(order asc) {
    _id,
    name,
    slug,
    description,
    order
  }`;
  return await client.fetch(query);
}

// Fetch companies by category
export async function getCompaniesByCategory(categoryName) {
  const query = `*[_type == "company" && category->name == $categoryName] | order(order asc) {
    _id,
    name,
    "category": category->name,
    oneLiner,
    detail,
    link,
    "logo": logo.asset->url,
    order
  }`;
  return await client.fetch(query, { categoryName });
}
