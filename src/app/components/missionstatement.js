'use client';
import React, { useEffect, useRef, useState } from 'react';
import missionStyles from '../landing page styles/mission statement.module.css';
import { MissionStatementRedBG } from './icons/background svgs/mission statement red bg';
import HeaderFlex from './icons/headerflex';
import { Gridsvg } from './icons/background svgs/gridsvg';

export default function MissionStatement() { 
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

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
    <section ref={sectionRef} className={missionStyles.sectionBG}>
      <div className={missionStyles.backgroundSVG}>
        <MissionStatementRedBG />
        <Gridsvg />
      </div>
      <div className={missionStyles.content}>
        <div className={missionStyles.headerWrapper}>
          <HeaderFlex
            title="We are an early stage, tech focused fund. And our love for deep tech runs deep."
            color="white"
            backgroundColor="#830d3498"
            desktopMaxWidth={'100%'}
            mobileMinHeight={'10rem'}
            customHeight={'10rem'} 
          />
        </div>
        <article className={`${missionStyles.bodyText} ${isVisible ? missionStyles.visible : ''}`}>
          <p className={isVisible ? missionStyles.visible : ''}>
            Yali Capital is helmed by a team of experts from the world of deep tech with a razor-sharp focus on
            early-stage companies. We help nurture startups through funding, mentorship, and access to a network of
            innovators and industry leaders.
          </p>
          <p className={isVisible ? missionStyles.visible : ''}>
            The core team at Yali Capital includes people from a range of backgrounds such as Semiconductor, Life
            Sciences, Machine Learning, and Venture Capital.
          </p>
        </article>
      </div>
    </section>
  );
};
