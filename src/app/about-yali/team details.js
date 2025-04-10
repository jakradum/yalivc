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

  useEffect(() => {
    // Get all members from local data
    const localMembers = localTeamData['Team Members'];
    
    // Start by setting all local team members
    setTeamMembers(localMembers);
    
    // If 10 or fewer members, show all of them
    if (localMembers.length <= 10) {
      setVisibleCount(localMembers.length);
      setShowLoadMore(false);
    } else {
      // Otherwise show only 4 initially
      setVisibleCount(4);
      setShowLoadMore(true);
    }
  }, []);

  useEffect(() => {
    if (data && data.status === 'success' && data.data && Array.isArray(data.data['Team Members'])) {
      // Get all remote members without filtering
      const remoteMembers = data.data['Team Members'];
      
      // Merge local and remote members
      setTeamMembers(prevMembers => {
        const combinedMembers = [...prevMembers];
        
        // Add any remote members that aren't already in the array
        remoteMembers.forEach(remoteMember => {
          // Check if this member is already in the array by some unique identifier
          // Using Name as a possible identifier - adjust if you have a better unique ID
          const exists = combinedMembers.some(m => m.Name === remoteMember.Name);
          if (!exists) {
            combinedMembers.push(remoteMember);
          }
        });
        
        // Update the load more logic based on total number of members
        if (combinedMembers.length <= 10) {
          setVisibleCount(combinedMembers.length);
          setShowLoadMore(false);
        } else if (combinedMembers.length > 10 && visibleCount < 4) {
          // If we now have more than 10 members but were showing all of them,
          // reset to showing 4 with load more option
          setVisibleCount(4);
          setShowLoadMore(true);
        } else {
          // Keep current visible count but ensure load more button is shown
          setShowLoadMore(true);
        }
        
        return combinedMembers;
      });
    }
  }, [data, visibleCount]);

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