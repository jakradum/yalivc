import investor from './schemas/investor'
import company from './schemas/company'
import news from './schemas/news'
import teamMember from './schemas/teamMember'
import category from './schemas/category'
import sector from './schemas/sector'
import investmentPhilosophy from './schemas/investmentPhilosophy'
import faq from './schemas/faq'
import socialUpdate from './schemas/socialUpdate'
import publication from './schemas/publication'
import blogPost from './schemas/blogPost'
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

// LP Portal Schemas
import lpFundSettings from './schemas/lpFundSettings'
import lpPipelineDeal from './schemas/lpPipelineDeal'
import lpQuarterlyReport from './schemas/lpQuarterlyReport'
import portalUser from './schemas/portalUser'
import lpPortalFeedback from './schemas/lpPortalFeedback'

export const schemaTypes = [
  investor,  // Must be before company (company references investor)
  company,
  news,
  teamMember,
  category,
  investmentPhilosophy,
  faq,
  socialUpdate,
  publication,
  blogPost,
  newsletter,
  openingNoteSection,
  essaySection,
  portfolioSpotlightSection,
  guestColumnSection,
  radarSection,
  readingSection,
  freeformSection,
  // LP Portal
  lpFundSettings,
  lpPipelineDeal,
  lpQuarterlyReport,
  portalUser,
  lpPortalFeedback
]