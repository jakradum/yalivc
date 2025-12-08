import blogPost from './blogPost'
import category from './category'
import company from './company'
import news from './news'
import publication from './publication'
import quarterlyReport from './quarterlyReport'
import teamMember from './teamMember'
import sector from './sector'
import investmentPhilosophy from './investmentPhilosophy'
import newsletter from './newsletter'
import {
  openingNoteSection,
  essaySection,
  portfolioSpotlightSection,
  guestColumnSection,
  radarSection,
  readingSection,
  freeformSection
} from './newsletterSections'

export const schemaTypes = [
  // Existing schemas
  blogPost,
  category,
  company,
  news,
  publication,
  quarterlyReport,
  teamMember,
  sector,
  investmentPhilosophy,
  // Newsletter
  newsletter,
  // Newsletter section types (objects)
  openingNoteSection,
  essaySection,
  portfolioSpotlightSection,
  guestColumnSection,
  radarSection,
  readingSection,
  freeformSection
]
