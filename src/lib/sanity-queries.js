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

export async function getTeamMembers() {
  return client.fetch(
    `*[_type == "team"] | order(order asc) {
      _id,
      name,
      role,
      bio,
      "photo": photo.asset->url,
      linkedIn,
      order
    }`
  );
}

export async function getSectors() {
  return client.fetch(
    `*[_type == "sector"] | order(order asc) {
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
