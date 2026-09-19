import { Cover } from '../slide-types/cover/Cover';
import { SectionDividerSlide } from '../slide-types/section-divider/SectionDividerSlide';
import { TeamGridSlide } from '../slide-types/team-grid/TeamGridSlide';
import { PersonGridSlide } from '../slide-types/person-grid/PersonGridSlide';
import { PortfolioGridSlide } from '../slide-types/portfolio-grid/PortfolioGridSlide';
import { KeyTermsSlide } from '../slide-types/key-terms/KeyTermsSlide';
import { DeploymentSlide } from '../slide-types/deployment/DeploymentSlide';
import { MediaGridSlide } from '../slide-types/media-grid/MediaGridSlide';
import { ContentsSlide } from '../slide-types/contents/ContentsSlide';
import { ClosingSlide } from '../slide-types/closing/ClosingSlide';
import { ThesisHubSlide } from '../slide-types/thesis-hub/ThesisHubSlide';
import { DealflowSlide } from '../slide-types/dealflow/DealflowSlide';
import { PortfolioSupportSlide } from '../slide-types/portfolio-support/PortfolioSupportSlide';
import { CXOMapSlide } from '../slide-types/cxo-map/CXOMapSlide';
import { GovernanceSlide } from '../slide-types/governance/GovernanceSlide';
import { fundIIDeck } from '../decks/fund-ii/manifest';

// slideType -> component.
export const slideComponents = {
  cover: Cover,
  'section-divider': SectionDividerSlide,
  'team-grid': TeamGridSlide,
  'person-grid': PersonGridSlide,
  'portfolio-grid': PortfolioGridSlide,
  'key-terms': KeyTermsSlide,
  deployment: DeploymentSlide,
  'media-grid': MediaGridSlide,
  contents: ContentsSlide,
  closing: ClosingSlide,
  'thesis-hub': ThesisHubSlide,
  dealflow: DealflowSlide,
  'portfolio-support': PortfolioSupportSlide,
  'cxo-map': CXOMapSlide,
  governance: GovernanceSlide,
};

// deckId -> manifest.
export const decks = {
  'fund-ii': fundIIDeck,
};
