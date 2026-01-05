'use client';

import React from 'react';
import Link from 'next/link';
import styles from './detail-styles.module.css';
import Image from 'next/image';
import { useData } from '../data/fetch component';
import imageLoader from '../../../image-loader';
import { Graphicfg } from '../components/icons/background svgs/graphicfg';
import Button from '../components/button';
import { DefenceVector } from '../components/icons/background svgs/category svgs/defence vector';

export default function TeamDetails({teamMembers}) {





  return (
    <div className={styles.teamListContainer}>
      {teamMembers.map((member, index) => {
        const MemberWrapper = member.enableTeamPage ? Link : 'article';
        const wrapperProps = member.enableTeamPage
          ? {
              href: `/about-yali/${member.slug?.current || member.slug}`,
              style: { textDecoration: 'none', color: 'inherit', cursor: 'pointer' }
            }
          : { style: { cursor: 'default' } };

        return (
          <MemberWrapper key={index} className={styles.teamMember} {...wrapperProps}>
            <div className={styles.memberInfo}>
              <div className={styles.header}>
                <h3 className={styles.name}>{member.name}</h3>
                <p className={styles.designation}>{member.role}</p>
              </div>
              <p className={styles.bio}>{member.bio}</p>
            </div>

            <div className={styles.memberImage}>
              {member.photo ? (
                <Image
                  loader={!member.photo?.startsWith('http') ? imageLoader : undefined}
                  src={member.photo}
                  alt={member.name}
                  width={300}
                  height={300}
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <Graphicfg />
              )}
            </div>
            <div className={styles.viewmoreButton}>
              {member.linkedIn && (
                <Button href={member.linkedIn} color="#000000" onClick={(e) => member.enableTeamPage && e.stopPropagation()}>
                  view on linkedin
                </Button>
              )}
            </div>
          </MemberWrapper>
        );
      })}
      <div className={styles.decorativeGraphic}>
<Graphicfg/>
      </div>
    </div>
  );
}
