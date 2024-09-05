"use client"
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useData } from '../data/fetch component';
import localTeamData from '../data/team.json';
import styles from '../landing page styles/team.module.css';
import { ExpandIcon } from './icons/small icons/expandIcon';

export const TeamsLPComponent = () => {
  const { data } = useData();
  const [selectedMember, setSelectedMember] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  // Use local data for first 4 members
  const localMembers = localTeamData['Team Members'].slice(0, 4);

  // Use remote data for additional members, starting from order 5
  const remoteMembers = data && data.status === 'success' && data.data && data.data['Team Members'] 
    ? data.data['Team Members'].filter(member => member.Order > 4)
    : [];

  const teamMembers = [...localMembers, ...remoteMembers];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 800);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getImagePath = (index) => {
    if (index < 4) {
      return localMembers[index].image;
    } else {
      return teamMembers[index].image || '/api/placeholder/400/400';
    }
  };

  const handleCellClick = (member, index) => {
    if (isMobile) {
      setExpandedRow(expandedRow === index ? null : index);
    } else {
      setSelectedMember(member);
    }
  };

  const renderTableRows = () => {
    const rows = [];
    for (let i = 0; i < teamMembers.length; i += (isMobile ? 1 : 2)) {
      const isLastOddMember = !isMobile && i === teamMembers.length - 1 && teamMembers.length % 2 !== 0;
      rows.push(
        <React.Fragment key={i}>
          <tr className={`${styles.tableRow} ${isMobile ? styles.mobileRow : ''}`}>
            <td 
              className={`${styles.teamMember} ${isLastOddMember ? styles.fullWidth : ''}`}
              onClick={() => handleCellClick(teamMembers[i], i)}
            >
              <div className={styles.memberInfo}>
                <p className={styles.name}>{teamMembers[i].Name}</p>
                <p className={styles.desig}>{teamMembers[i].Designation}</p>
                <div className={styles.socialLinks}>
                  {teamMembers[i].linkedin && (
                    <a href={teamMembers[i].linkedin} target="_blank" rel="noopener noreferrer">
                      <button className={styles.socialButton}>in</button>
                    </a>
                  )}
                </div>
              </div>
              {isMobile && <ExpandIcon className={styles.expandIcon} />}
            </td>
            {!isMobile && !isLastOddMember && teamMembers[i + 1] && (
              <td 
                className={styles.teamMember}
                onClick={() => handleCellClick(teamMembers[i + 1], i + 1)}
              >
                <div className={styles.memberInfo}>
                  <p className={styles.name}>{teamMembers[i + 1].Name}</p>
                  <p className={styles.desig}>{teamMembers[i + 1].Designation}</p>
                  <div className={styles.socialLinks}>
                    {teamMembers[i + 1].linkedin && (
                      <a href={teamMembers[i + 1].linkedin} target="_blank" rel="noopener noreferrer">
                        <button className={styles.socialButton}>in</button>
                      </a>
                    )}
                  </div>
                </div>
              </td>
            )}
          </tr>
          {isMobile && expandedRow === i && (
            <tr className={styles.expandedContent}>
              <td colSpan="2">
                <Image 
                  src={getImagePath(i)} 
                  alt={teamMembers[i].Name} 
                  width={300}
                  height={300}
                  className={styles.memberImage}
                />
                <p>{teamMembers[i]['One-Liner']}</p>
              </td>
            </tr>
          )}
        </React.Fragment>
      );
    }
    return rows;
  };

  return (
    <div className={styles.teamsLpContainer}>
      <table className={styles.teamTable}>
        <tbody>{renderTableRows()}</tbody>
      </table>
      {!isMobile && (
        <div className={styles.teamDescription}>
          {selectedMember ? (
            <>
              <Image 
                src={getImagePath(teamMembers.indexOf(selectedMember))} 
                alt={selectedMember.Name} 
                width={300}
                height={300}
                className={styles.memberImage}
              />
              <h3 className={styles.selectedMemberName}>{selectedMember.Name}</h3>
              <p className={styles.selectedMemberDesignation}>{selectedMember.Designation}</p>
              <p className={styles.selectedMemberOneLiner}>{selectedMember['One-Liner']}</p>
            </>
          ) : (
            <>
              <Image 
                src={getImagePath(0)} 
                alt="Team member" 
                width={500}
                height={300}
                className={styles.teamImage}
              />
              <h2>With over 96 years of experience in lore ipsum dolor si amet.</h2>
              <p>"Ut ullamcorper risus ut suspendisse. Arcu et odio velit in morbi egestas."</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamsLPComponent;