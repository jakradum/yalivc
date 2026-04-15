'use client';
import React, { useEffect, useRef, useState } from 'react';
import missionStyles from '../landing-page-styles/mission-statement.module.css';
import HeaderFlex from './icons/headerflex';
import { MissionStatementRedBG } from './icons/background svgs/mission statement red bg';
import { Gridsvg } from './icons/background svgs/gridsvg';

export default function MissionStatement({ stats = {} }) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  const {
    categoryCount = 6,
    companyCount = 3,
    collectiveExperience = 60,
    location = 'Bangalore',
  } = stats;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: .01,
        rootMargin: '0px 0px -10% 0px'
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <div className={missionStyles.sectionWrapper}>
    <section ref={sectionRef} className={missionStyles.sectionBG}>
      <div className={missionStyles.backgroundSVG}>
        <Gridsvg />
      </div>
      <div className={missionStyles.content}>
        <div className={missionStyles.leftColumn}>
          <div className={missionStyles.headerWrapper}>
            <HeaderFlex
              title="Our mission is to push India past its deep tech event horizon."
              color="white"
              backgroundColor="#830d3498"
              desktopMaxWidth={'100%'}
              mobileMinHeight={'10rem'}
              customHeight={'10rem'}
            />
          </div>
          <article className={`${missionStyles.bodyText} ${isVisible ? missionStyles.visible : ''}`}>
            <p className={isVisible ? missionStyles.visible : ''}>
              Backing founders building world-class technology companies across six deep tech sectors.
            </p>
          </article>
          <div className={`${missionStyles.statStrip} ${isVisible ? missionStyles.visible : ''}`}>
            <div className={missionStyles.statCell}>
              <span className={missionStyles.statValue}>{categoryCount}</span>
              <span className={missionStyles.statLabel}> Active sectors</span>
            </div>
            <div className={missionStyles.statCell}>
              <span className={missionStyles.statValue}>{companyCount}</span>
              <span className={missionStyles.statLabel}>Portfolio companies</span>
            </div>
            <div className={missionStyles.statCell}>
              <span className={missionStyles.statValue}>{collectiveExperience}</span>
              <span className={missionStyles.statLabel}>Years collective deep tech experience</span>
            </div>
            <div className={`${missionStyles.statCell} ${missionStyles.statCellLast}`}>
              <span className={missionStyles.statValue}>{location}</span>
              <span className={missionStyles.statLabel}>India</span>
            </div>
          </div>
        </div>
        <div className={missionStyles.rightColumn}>
          <MissionStatementRedBG />
        </div>
      </div>
    </section>
    </div>
  );
};
