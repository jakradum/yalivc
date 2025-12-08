import company from './schemas/company'
import news from './schemas/news'
import teamMember from './schemas/teamMember'
import category from './schemas/category'
import sector from './schemas/sector'
import investmentPhilosophy from './schemas/investmentPhilosophy'
import faq from './schemas/faq'
import publication from './schemas/publication'
import blogPost from './schemas/blogPost'
import quarterlyReport from './schemas/quarterlyReport'
import newsletter from './schemas/newsletter'
import {
  openingNoteSection,
  essaySection,
  portfolioSpotlightSection,
  guestColumnSection,
  radarSection,
  readingSection,
  freeformSection
} from './schemas/newsletterSections'

export const schemaTypes = [
  company,
  news,
  teamMember,
  category,
  investmentPhilosophy,
  faq,
  publication,
  blogPost,
  quarterlyReport,
  newsletter,
  openingNoteSection,
  essaySection,
  portfolioSpotlightSection,
  guestColumnSection,
  radarSection,
  readingSection,
  freeformSection
]