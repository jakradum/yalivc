import { PersonProfile } from '../design-system/blocks/PersonProfile/PersonProfile';
import { personProfileFixtures } from '../design-system/blocks/PersonProfile/PersonProfile.fixtures';
import { StatTile } from '../design-system/blocks/StatTile/StatTile';
import { statTileFixtures } from '../design-system/blocks/StatTile/StatTile.fixtures';
import { Card } from '../design-system/blocks/Card/Card';
import { cardFixtures } from '../design-system/blocks/Card/Card.fixtures';
import { CompanyCard } from '../design-system/blocks/CompanyCard/CompanyCard';
import { companyCardFixtures } from '../design-system/blocks/CompanyCard/CompanyCard.fixtures';
import { TeamCard } from '../design-system/blocks/TeamCard/TeamCard';
import { teamCardFixtures } from '../design-system/blocks/TeamCard/TeamCard.fixtures';
import { PieChart } from '../design-system/blocks/PieChart/PieChart';
import { pieChartFixtures } from '../design-system/blocks/PieChart/PieChart.fixtures';
import { PortfolioTable } from '../design-system/blocks/PortfolioTable/PortfolioTable';
import { portfolioTableFixtures } from '../design-system/blocks/PortfolioTable/PortfolioTable.fixtures';
import { SankeyStats } from '../design-system/blocks/SankeyStats/SankeyStats';
import { sankeyStatsFixtures } from '../design-system/blocks/SankeyStats/SankeyStats.fixtures';
import { MediaTile } from '../design-system/blocks/MediaTile/MediaTile';
import { mediaTileFixtures } from '../design-system/blocks/MediaTile/MediaTile.fixtures';
import { SectionDivider } from '../design-system/blocks/SectionDivider/SectionDivider';
import { sectionDividerFixtures } from '../design-system/blocks/SectionDivider/SectionDivider.fixtures';
import { SlideNumber } from '../design-system/blocks/SlideNumber/SlideNumber';
import { slideNumberFixtures } from '../design-system/blocks/SlideNumber/SlideNumber.fixtures';
import { VertLabel } from '../design-system/blocks/VertLabel/VertLabel';
import { vertLabelFixtures } from '../design-system/blocks/VertLabel/VertLabel.fixtures';
import { HubAndSpoke } from '../design-system/diagrams/HubAndSpoke/HubAndSpoke';
import { hubAndSpokeFixtures } from '../design-system/diagrams/HubAndSpoke/HubAndSpoke.fixtures';

// Every block + its fixtures. Phase 2 complete set.
export const workbenchEntries = [
  { name: 'PersonProfile', Component: PersonProfile, fixtures: personProfileFixtures, dark: true },
  { name: 'StatTile', Component: StatTile, fixtures: statTileFixtures, dark: false },
  { name: 'Card', Component: Card, fixtures: cardFixtures, dark: false },
  { name: 'CompanyCard', Component: CompanyCard, fixtures: companyCardFixtures, dark: false },
  { name: 'TeamCard', Component: TeamCard, fixtures: teamCardFixtures, dark: false },
  { name: 'PieChart', Component: PieChart, fixtures: pieChartFixtures, dark: false },
  { name: 'PortfolioTable', Component: PortfolioTable, fixtures: portfolioTableFixtures, dark: false },
  { name: 'SankeyStats', Component: SankeyStats, fixtures: sankeyStatsFixtures, dark: false },
  { name: 'MediaTile', Component: MediaTile, fixtures: mediaTileFixtures, dark: false },
  { name: 'SectionDivider', Component: SectionDivider, fixtures: sectionDividerFixtures, dark: false, box: { width: 300, height: 180 } },
  { name: 'SlideNumber', Component: SlideNumber, fixtures: slideNumberFixtures, dark: false, box: { width: 120, height: 60, relative: true } },
  { name: 'VertLabel', Component: VertLabel, fixtures: vertLabelFixtures, dark: false, box: { width: 120, height: 120, relative: true } },
  { name: 'HubAndSpoke', Component: HubAndSpoke, fixtures: hubAndSpokeFixtures, dark: false, box: { width: 440, height: 245 } },
];
