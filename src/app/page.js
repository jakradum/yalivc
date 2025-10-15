

import React from 'react';
import { getCompanies, getNews, getTeamMembers } from '@/lib/sanity-queries';
import teamData from './data/team.json';
import landingStyles from './landing page styles/landingscroll.module.css';
import { DottedLogoGraphic } from './components/icons/background svgs/graphic bg';
import { ViewfinderIcon } from './components/icons/small icons/viewfinder icon';
import { Graphicfg } from './components/icons/background svgs/graphicfg';
import missionStyles from './landing page styles/mission statement.module.css';
import teamStyles from './landing page styles/team.module.css';
import categories from './data/categories.json';
import separatorStyles from './landing page styles/separator.module.css';
import HeaderFlex from './components/icons/headerflex';
import MissionStatement from './components/missionstatement';
import companyStyles from './landing page styles/companies.module.css';
import CompanyGrid from './components/companygrid';
import NewsSection from './components/newssection.js';
import TeamsLPComponent from './components/teams LP component';
import Button from './components/button';
export const revalidate = 60;

export const genericButtonText = 'view more';


const TechnologiesArticle = () => {
  const technologies = categories.emergingTechnologies;
  const repeatTechnologies = (arr, times) => [].concat(...Array(times).fill(arr));
  const repeatedTechnologies = repeatTechnologies(technologies, 10);
  

  return (
    <div className={separatorStyles.containerWrapper}>
      <div className={separatorStyles.repeatingContainer}>
        {repeatedTechnologies.map((tech, index) => (
          <React.Fragment key={`${tech}-${index}`}>
            {index > 0 && <span className={separatorStyles.separator}>·</span>}
            <span className={separatorStyles.technology}>{tech}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default async function HomePage() {
  const companies = await getCompanies();
  const news = await getNews();
  const sanityTeam = await getTeamMembers();
  
 const coreTeam = teamData['Team Members']
   .map((member) => ({
     name: member.Name,
     role: member.Designation,
     oneLiner: member['One-Liner'],
     bio: member.Detailed,
     photo: member.image,
     linkedIn: member.linkedin,
     order: member.Order,
   }))
   .sort((a, b) => a.order - b.order);
  
  const team = [...coreTeam, ...sanityTeam].sort((a, b) => (a.order || 999) - (b.order || 999));

  return (
    <main>
      <section className={landingStyles.heroSection}>
        <aside className={landingStyles.contentWrapper}>
          <div className={landingStyles.headingBox}>
            <p>
              We believe the next wave of large-scale innovation will have roots in deep tech. With investments across
              sectors like Semiconductors, Robotics, Genomics, Aerospace, and AI, we're helping India's startups build
              for the future, and we are only getting started.
            </p>
            <div className={landingStyles.headerFlex}>
              <ViewfinderIcon />
              <h1>Helping India's deep tech soar. Because, our growth story is still being written.</h1>
              <ViewfinderIcon />
            </div>
          </div>
        </aside>
        <aside className={landingStyles.graphicWrapper}>
          <div className={landingStyles.graphicFg}>
            <Graphicfg />
          </div>
          <div className={landingStyles.dottedLogo}>
            <DottedLogoGraphic />
          </div>
        </aside>
      </section>

      <TechnologiesArticle />

      <section className={missionStyles.sectionBG}>
        <MissionStatement />
      </section>

      <section className={companyStyles.section}>
        <div className={companyStyles.titleSec}>
          <HeaderFlex title="Our companies make us proud" color="black" desktopMaxWidth={'45%'} />
        </div>
        <CompanyGrid companies={companies} />
      </section>

      <section className={teamStyles.teamSec}>
        <header className={teamStyles.titleSec}>
          <div className={teamStyles.titleSecFlex}>
            <HeaderFlex title="Meet the Yali team" color="black" desktopMaxWidth={'50%'} />
            <aside>
              <p>
                The team at Yali Capital is armed with an impressive track record of successful investment history, and
                a combined 60 years in the deep tech domain.
              </p>
            </aside>
          </div>
        </header>
        <TeamsLPComponent teamMembers={team} />
      </section>

      <section>
        <div className={companyStyles.titleSec}>
          <HeaderFlex title="Yali in the news" color="black" desktopMaxWidth={'35%'} mobileMaxWidth={'80%'} />
        </div>
        <NewsSection news={news} />
      </section>
    </main>
  );
}

// export default function HomePage() {
//   return (
//     <DataProvider>
//       <HomeContent />
//     </DataProvider>
//   );
// }
