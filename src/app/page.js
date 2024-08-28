import React from 'react';
import landingStyles from './landing page styles/landingscroll.module.css';
import { DottedLogoGraphic } from './components/icons/background svgs/graphic bg';
import { ViewfinderIcon } from './components/icons/small icons/viewfinder icon';
import { Graphicfg } from './components/icons/background svgs/graphicfg';
import missionStyles from './landing page styles/mission statement.module.css';
import { MissionStatementRedBG } from './components/icons/background svgs/mission statement red bg';
import categories from './data/categories.json';
import separatorStyles from './landing page styles/separator.module.css';
import HeaderFlex from './components/icons/headerflex';
import MissionStatement from './components/missionstatement';

const TechnologiesArticle = () => {
  const technologies = categories.emergingTechnologies;

  // Function to repeat the array multiple times
  const repeatTechnologies = (arr, times) => [].concat(...Array(times).fill(arr));

  const repeatedTechnologies = repeatTechnologies(technologies, 10); // Repeat 10 times, adjust as needed

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

export default function Home() {
  return (
    <main>
      {/* Landing scroll */}
      <section className={landingStyles.heroSection}>
        <aside className={landingStyles.contentWrapper}>
          <div className={landingStyles.headingBox}>
            <p>
              We believe the next wave of large-scale innovation will have roots in deep tech. With investments across
              sectors like Semiconductors, Robotics, Genomics, Aerospace, and AI, we're helping India's startups build
              for the future, and we're only getting started.
            </p>
            <div className={landingStyles.headerFlex}>
              <ViewfinderIcon />
              <h1>Raising the bar for India's deep tech.<br/> One investment at a time.</h1>
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

      {/* Technologies Article */}
      <TechnologiesArticle />

      {/* Mission statement scroll */}
      <section className={missionStyles.sectionBG}>
        <MissionStatement/>
      </section>
      <section>
        <HeaderFlex title='Our companies make us proud' color='black'/>
      </section>
    </main>
  );
}
