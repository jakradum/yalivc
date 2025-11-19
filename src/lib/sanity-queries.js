import { client } from '@/sanity/client';

export async function getCompanies() {
  return client.fetch(
    `*[_type == "company"] | order(order asc) {
      _id,
      name,
      slug,
      "category": category->name,
      oneLiner,
      detail,
      link,
      "logo": logo.asset->url,
      order
    }`
  );
}

export async function getCompanyBySlug(slug) {
  return client.fetch(
    `*[_type == "company" && slug.current == $slug][0]{
      _id,
      name,
      slug,
      category->{name},
      oneLiner,
      detail,
      link,
      logo
    }`,
    { slug }
  );
}

export async function getNews() {
  return client.fetch(
    `*[_type == "news"] | order(date desc) {
      _id,
      url,
      date,
      headlineEdited,
      isVideo,
      "publicationName": publication->name
    }`
  );
}

export async function getInvestmentPhilosophy() {
  return client.fetch(
    `*[_type == "investmentPhilosophy"][0]{
      philosophyText,
      lastUpdated
    }`
  );
}

export async function getTeamMembers() {
  return client.fetch(
    `*[_type == "teamMember" && showOnHomepage == true] | order(order asc) {
      _id,
      name,
      role,
      bio,
      oneLiner,
      "photo": photo.asset->url,
      linkedIn,
      order
    }`
  );
}

export async function getSectors() {
  return client.fetch(
    `*[_type == "sector" && published == true] | order(order asc) {
      _id,
      name,
      slug,
      shortDescription,
      order
    }`
  );
}

export async function getSectorBySlug(slug) {
  return client.fetch(
    `*[_type == "sector" && slug.current == $slug][0]{
      _id,
      name,
      slug,
      shortDescription,
      overview,
      whyYALICares
    }`,
    { slug }
  );
}

export async function getNewsBySector(sectorSlug) {
  return client.fetch(
    `*[_type == "news" && $sectorSlug in relatedSectors[]->slug.current] | order(date desc) {
      _id,
      url,
      date,
      headlineEdited,
      isVideo,
      "publicationName": publication->name
    }[0...5]`,
    { sectorSlug }
  );
}

export async function getFAQs(type) {
  return client.fetch(
    `*[_type == "faq" && type == $type] | order(order asc){
      _id,
      question,
      answer,
      order
    }`,
    { type }
  );
}

export async function getNewsByCompany(companySlug) {
  return client.fetch(
    `*[_type == "news" && $companySlug in relatedCompanies[]->slug.current] | order(date desc) {
      _id,
      url,
      date,
      headlineEdited,
      isVideo,
      "publicationName": publication->name
    }[0...5]`,
    { companySlug }
  );
}

// Add these functions to your existing sanity-queries.js file

// UPDATE this function in /src/lib/sanity-queries.js

export async function getBlogPostBySlug(slug) {
  return client.fetch(
    `*[_type == "blogPost" && slug.current == $slug && status == "published"][0]{
      _id,
      title,
      slug,
      blurb,
      body[]{
        ...,
        _type == "image" => {
          ...,
          asset->
        }
      },
      contentType,
      publishedAt,
      featuredImage {
        asset->{url},
        alt
      },
      author->{
        _id,
        name,
        role,
        oneLiner,
        "photo": photo.asset->url,
        linkedIn
      },
      sectors[]->{
        _id,
        name,
        slug
      },
      companies[]->{
        _id,
        name,
        slug
      },
      metaTitle,
      metaDescription,
      ogImage {
        asset->{url}
      }
    }`,
    { slug }
  );
}

export async function getAllBlogPosts(options = {}) {
  const {
    limit = 12,
    offset = 0,
    authorId = null,
    sectorId = null,
    companyId = null
  } = options;

  let filters = `_type == "blogPost" && status == "published"`;
  
  if (authorId) filters += ` && author._ref == "${authorId}"`;
  if (sectorId) filters += ` && "${sectorId}" in sectors[]._ref`;
  if (companyId) filters += ` && "${companyId}" in companies[]._ref`;

  return client.fetch(
    `{
      "posts": *[${filters}] | order(featured desc, publishedAt desc) [${offset}...${offset + limit}] {
        _id,
        title,
        slug,
        blurb,
        contentType,
        publishedAt,
        featured,
        featuredImage {
          asset->{url},
          alt
        },
        author->{
          _id,
          name
        },
        sectors[]->{
          _id,
          name
        },
        companies[]->{
          _id,
          name
        }
      },
      "total": count(*[${filters}])
    }`
  );
}

export async function getRelatedBlogPosts(currentPostId, sectors, companies, limit = 3) {
  return client.fetch(
    `*[_type == "blogPost" 
      && status == "published" 
      && _id != $currentPostId
      && (
        count((sectors[]._ref)[@ in $sectorIds]) > 0 ||
        count((companies[]._ref)[@ in $companyIds]) > 0
      )
    ] | order(publishedAt desc) [0...$limit] {
      _id,
      title,
      slug,
      blurb,
      publishedAt,
      featuredImage {
        asset->{url},
        alt
      },
      author->{
        name
      }
    }`,
    {
      currentPostId,
      sectorIds: sectors?.map((s) => s._id) || [],
      companyIds: companies?.map((c) => c._id) || [],
      limit,
    }
  );
}

export async function getBlogAuthors() {
  return client.fetch(
    `*[_type == "teamMember" && count(*[_type == "blogPost" && status == "published" && references(^._id)]) > 0] | order(name asc) {
      _id,
      name
    }`
  );
}

// ADD: Get all sectors with published posts
export async function getBlogSectors() {
  return client.fetch(
    `*[_type == "sector" && count(*[_type == "blogPost" && status == "published" && references(^._id)]) > 0] | order(name asc) {
      _id,
      name
    }`
  );
}

// ADD: Get all companies with published posts
export async function getBlogCompanies() {
  return client.fetch(
    `*[_type == "company" && count(*[_type == "blogPost" && status == "published" && references(^._id)]) > 0] | order(name asc) {
      _id,
      name
    }`
  );
}
