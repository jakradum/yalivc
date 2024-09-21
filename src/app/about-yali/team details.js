'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useData } from '../data/fetch component';
import localTeamData from '../data/team.json';
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
  const handleImageError = () => {
    console.error('Image failed to load:', imgSrc);
    setImgError(true);
    // Attempt to use a fallback image or placeholder
    setImgSrc('/placeholder.jpg'); // Ensure you have a placeholder image in your public folder
  };

  return (
    <div className={styles.teamMember}>
      <div className={styles.memberInfo}>
        <header className={styles.header}>
          {isMobile ? <h2 className={styles.name}>{member.Name}</h2> : <p className={styles.name}>{member.Name}</p>}
          <p className={styles.designation}>{member.Designation}</p>
        </header>
        <p className={styles.bio}>{member.Detailed || member['One-Liner']}</p>
        <div className={styles.viewmoreButton}>
          {member.linkedin && (
            <Button href={member.linkedin} color="black">
              view on linkedin
            </Button>
          )}
        </div>
      </div>
      <div className={styles.memberImage}>
        <Image
          loader={imageLoader}
          src={imgSrc}
          alt={member.Name}
          width={400}
          height={400}
          style={{ objectFit: 'cover' }}
          onError={handleImageError}
        />
      </div>
    </div>
  );
};

const TeamList = () => {
  const { data } = useData();
  const [visibleCount, setVisibleCount] = useState(4);
  const [teamMembers, setTeamMembers] = useState(localTeamData['Team Members'].slice(0, 4));

  useEffect(() => {
    if (data && data.status === 'success' && data.data && Array.isArray(data.data['Team Members'])) {
      const remoteMembers = data.data['Team Members'].filter((member) => member.Order > 4);
      setTeamMembers((prevMembers) => [...prevMembers, ...remoteMembers]);
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
      {visibleCount < teamMembers.length && (
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
