'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useData } from '../data/fetch component';
import styles from './detail styles.module.css';
import Button from '../components/button';
import imageLoader from '../../../image-loader';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 800);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

const TeamMember = ({ member }) => {
  const isMobile = useIsMobile();
  const [imgSrc, setImgSrc] = useState(member.image);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    console.log('Original image path:', member.image);
    console.log('Processed image path:', imageLoader({ src: member.image, width: 400 }));
  }, [member.image]);

  const handleImageError = () => {
    console.error('Image failed to load:', member.image);
    setImgError(true);
  };

  return (
    <div className={styles.teamMember}>
      <div className={styles.memberInfo}>
        <header className={styles.header}>
          {isMobile ? <h2 className={styles.name}>{member.name}</h2> : <p className={styles.name}>{member.name}</p>}
          <p className={styles.designation}>{member.designation}</p>
        </header>
        <p className={styles.bio}>{member.detailed || member.oneLiner}</p>
        <div className={styles.viewmoreButton}>
          {member.linkedin && (
            <Button href={member.linkedin} color="black">
              view on linkedin
            </Button>
          )}
        </div>
      </div>
      <div className={styles.memberImage}>
        {!imgError ? (
          <Image
            loader={imageLoader}
            src={member.image}
            alt={member.Name}
            width={400}
            height={400}
            style={{ objectFit: 'cover' }}
            onError={handleImageError}
          />
        ) : (
          <div>Image failed to load</div>
        )}
      </div>
    </div>
  );
};

const TeamList = () => {
  const { data } = useData();
  const [visibleCount, setVisibleCount] = useState(4);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showLoadMore, setShowLoadMore] = useState(false);
  console.log('Full data object:', data);

  console.log('Full data object:', data);
  console.log('Team array:', data?.data?.team);
  console.log('Team length:', data?.data?.team?.length);

  useEffect(() => {
    if (data && data.data && Array.isArray(data.data.team)) {
      const members = data.data.team;
      setTeamMembers(members);

      if (members.length <= 10) {
        setVisibleCount(members.length);
        setShowLoadMore(false);
      } else {
        setVisibleCount(4);
        setShowLoadMore(true);
      }
    }
  }, [data]);

  const handleLoadMore = () => {
    setVisibleCount((prevCount) => Math.min(prevCount + 4, teamMembers.length));
  };

  return (
    <div className={styles.teamListContainer}>
      {teamMembers.slice(0, visibleCount).map((member, index) => (
        <TeamMember key={index} member={member} />
      ))}
      {showLoadMore && visibleCount < teamMembers.length && (
        <button className={styles.loadMore} onClick={handleLoadMore}>
          LOAD MORE
        </button>
      )}
    </div>
  );
};

export const TeamDetails = () => {
  return <TeamList />;
};

export default TeamDetails;
