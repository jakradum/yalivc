'use client';

import React from 'react';
import styles from './detail-styles.module.css';
import Image from 'next/image';
import { useData } from '../data/fetch component';
import imageLoader from '../../../image-loader';
import { Graphicfg } from '../components/icons/background svgs/graphicfg';
import Button from '../components/button';

export default function TeamDetails({teamMembers}) {





  return (
    <div className={styles.teamListContainer}>
      {teamMembers.map((member, index) => (
        <article key={index} className={styles.teamMember}>
          <div className={styles.memberInfo}>
            <div className={styles.header}>
              <h3 className={styles.name}>{member.name}</h3>
              <p className={styles.designation}>{member.role}</p>
            </div>
            <p className={styles.bio}>{member.bio}</p>
            <div className={styles.viewmoreButton}>
              {member.linkedIn && (
                <Button href={member.linkedIn} color="#000000">
                  view on linkedin
                </Button>
              )}
            </div>
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
        </article>
      ))}
    </div>
  );
}
