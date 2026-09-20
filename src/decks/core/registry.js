import { Cover } from '../slide-types/cover/Cover';
import { SectionDividerSlide } from '../slide-types/section-divider/SectionDividerSlide';
import { TeamGridSlide } from '../slide-types/team-grid/TeamGridSlide';
import { PersonGridSlide } from '../slide-types/person-grid/PersonGridSlide';
import { PortfolioGridSlide } from '../slide-types/portfolio-grid/PortfolioGridSlide';
import { PortfolioTable } from '../design-system/blocks/PortfolioTable/PortfolioTable';
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
import { FundStatsSlide } from '../slide-types/fund-stats/FundStatsSlide';
import { DealflowSummarySlide } from '../slide-types/dealflow-summary/DealflowSummarySlide';
import { SectorPieSlide } from '../slide-types/sector-pie/SectorPieSlide';
import { LpLogosSlide } from '../slide-types/lp-logos/LpLogosSlide';
import { NearTermSlide } from '../slide-types/near-term/NearTermSlide';
import { TitleSlide } from '../slide-types/title/TitleSlide';
import { LogomarkSlide } from '../slide-types/logomark/LogomarkSlide';
import { fundIIDeck } from '../decks/fund-ii/manifest';

// slideType -> component.
export const slideComponents = {
  cover: Cover,
  'section-divider': SectionDividerSlide,
  'team-grid': TeamGridSlide,
  'person-grid': PersonGridSlide,
  'portfolio-grid': PortfolioGridSlide,
  'portfolio-table': PortfolioTable,
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
  'fund-stats': FundStatsSlide,
  'dealflow-summary': DealflowSummarySlide,
  'sector-pie': SectorPieSlide,
  'lp-logos': LpLogosSlide,
  'near-term': NearTermSlide,
  title: TitleSlide,
  logomark: LogomarkSlide,
};

// deckId -> manifest.
export const decks = {
  'fund-ii': fundIIDeck,
};
