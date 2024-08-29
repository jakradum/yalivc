'use client';
import React, { useEffect, useRef, useState } from 'react';
import missionStyles from '../landing page styles/mission statement.module.css';
import { MissionStatementRedBG } from './icons/background svgs/mission statement red bg';
import HeaderFlex from './icons/headerflex';

const MissionStatement = () => {
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
      </div>
      <div className={missionStyles.content}>
        <HeaderFlex title="We are an early stage, tech focused fund. And our love for deep tech runs deep." color="white" />
        <article className={`${missionStyles.bodyText} ${isVisible ? missionStyles.visible : ''}`}>
          <p>
            Yali Capital is helmed by a team of experts from the world of deep tech with a razor-sharp focus on
            early-stage companies. We help nurture startups through funding, mentorship, and access to a network of
            innovators and industry leaders.
          </p>
          <p>
            The core team at Yali Capital includes people from a range of backgrounds such as Semiconductor, Life
            Sciences, Machine Learning, and Venture Capital.
          </p>
        </article>
      </div>
    </section>
  );
};

export default MissionStatement;