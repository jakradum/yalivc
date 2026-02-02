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
import faq from './faq'
import socialUpdate from './socialUpdate'
import {
  openingNoteSection,
  essaySection,
  portfolioSpotlightSection,
  guestColumnSection,
  radarSection,
  readingSection,
  freeformSection
} from './newsletterSections'
// LP Portal schemas
import lpQuarterlyReport from './lpQuarterlyReport'
import lpFundSettings from './lpFundSettings'
import lpPipelineDeal from './lpPipelineDeal'

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
  freeformSection,
  // LP Portal
  lpQuarterlyReport,
  lpFundSettings,
  lpPipelineDeal,
  // Homepage sections
  faq,
  socialUpdate
]
