import { client } from './sanity.js';

// Fetch all companies
export async function getCompanies() {
  const query = `*[_type == "company"] | order(order asc) {
    _id,
    name,
    slug,
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
  const coreNames = [
    "Ganapathy 'Gani' Subramaniam",
    "Lip-Bu Tan",
    "Mathew Cyriac",
    "Karthikeyan 'Karthik' Madathil",
    "Sunil S Patil"
  ];
  
  return client.fetch(`
    *[_type == "teamMember" && !(name in $coreNames)] | order(order asc) {
      name,
      role,
      oneLiner,
      bio,
      "photo": photo.asset->url,
      linkedIn,
      order
    }
  `, { coreNames });
}

// Get Investment Philosophy (singleton)
export async function getInvestmentPhilosophy() {
  return client.fetch(
    `*[_type == "investmentPhilosophy"][0]{
      philosophyText,
      lastUpdated
    }`
  );
}

// Get Sector by slug
export async function getSectorBySlug(slug) {
  return client.fetch(
    `*[_type == "sector" && slug.current == $slug][0]{
      _id,
      name,
      slug,
      iconName,
      shortDescription,
      overview,
      whyYALICares
    }`,
    { slug }
  );
}

export async function getCoreTeamExtras() {
  const coreNames = [
    "Ganapathy 'Gani' Subramaniam",
    "Lip-Bu Tan",
    "Mathew Cyriac",
    "Karthikeyan 'Karthik' Madathil",
    "Sunil S Patil"
  ];
  
  return client.fetch(`
    *[_type == "teamMember" && name in $coreNames] {
      name,
      personalPhilosophy,
      outsideWork
    }
  `, { coreNames });
}

// Get all Sectors
export async function getSectors() {
  return client.fetch(
    `*[_type == "sector"] | order(name asc){
      _id,
      name,
      slug,
      iconName,
      shortDescription
    }`
  );
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