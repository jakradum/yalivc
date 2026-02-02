'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './detail-styles.module.css';
import Image from 'next/image';
import imageLoader from '../../../image-loader';
import { Graphicfg } from '../components/icons/background svgs/graphicfg';
import Button from '../components/button';

const BIO_CHAR_LIMIT = 900;

const TruncatedBio = ({ bio, enableTeamPage, slug }) => {
  if (!bio) return null;

  const needsTruncation = bio.length > BIO_CHAR_LIMIT;
  const displayBio = needsTruncation ? bio.substring(0, BIO_CHAR_LIMIT).trim() + '...' : bio;

  return (
    <>
      <p className={styles.bio}>{displayBio}</p>
      {needsTruncation && enableTeamPage && (
        <span className={styles.viewMoreText}>view more</span>
      )}
    </>
  );
};

export default function TeamDetails({teamMembers}) {
  const [cursorTooltip, setCursorTooltip] = useState({ visible: false, x: 0, y: 0 });

  const handleMouseMove = (e, hasProfilePage) => {
    if (hasProfilePage) {
      setCursorTooltip({
        visible: true,
        x: e.clientX + 15,
        y: e.clientY + 15
      });
    }
  };

  const handleMouseLeave = () => {
    setCursorTooltip({ visible: false, x: 0, y: 0 });
  };

  return (
    <div className={styles.teamListContainer}>
      {/* Cursor tooltip */}
      {cursorTooltip.visible && (
        <div
          className={styles.cursorTooltip}
          style={{
            position: 'fixed',
            left: cursorTooltip.x,
            top: cursorTooltip.y,
            pointerEvents: 'none',
            zIndex: 9999
          }}
        >
          Click to see profile
        </div>
      )}
      {teamMembers.map((member, index) => {
        const MemberWrapper = member.enableTeamPage ? Link : 'article';
        const wrapperProps = member.enableTeamPage
          ? {
              href: `/about-yali/${member.slug?.current || member.slug}`,
              style: { textDecoration: 'none', color: 'inherit', cursor: 'pointer' },
              onMouseMove: (e) => handleMouseMove(e, true),
              onMouseLeave: handleMouseLeave
            }
          : { style: { cursor: 'default' } };

        return (
          <MemberWrapper key={index} className={styles.teamMember} {...wrapperProps}>
            <div className={styles.memberInfo}>
              <div className={styles.header}>
                <h3 className={styles.name}>{member.name}</h3>
                <p className={styles.designation}>{member.role}</p>
              </div>
              <TruncatedBio bio={member.bio} enableTeamPage={member.enableTeamPage} slug={member.slug} />
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
              {member.enableTeamPage && (
                <p className={styles.viewProfileBadge}>View page</p>
              )}
            </div>
            <div className={styles.viewmoreButton} onClick={(e) => e.stopPropagation()}>
              {member.linkedIn && (
                <Button href={member.linkedIn} color="#000000" target="_blank">
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
