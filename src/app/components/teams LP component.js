'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useData } from '../data/fetch component';
import localTeamData from '../data/team.json';
import styles from '../landing page styles/team.module.css';
import { ExpandIcon } from './icons/small icons/expandIcon';
import { TeamsDefaultSVG } from './icons/background svgs/teams default display';
import Button from './button';
import { genericButtonText } from '../page';
import { Graphicfg } from './icons/background svgs/graphicfg';

export const TeamsLPComponent = () => {
  const { data } = useData();
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [tableHeight, setTableHeight] = useState(0);

  // Use local data for first 4 members
  const localMembers = localTeamData['Team Members'].slice(0, 4);

  // Use remote data for additional members, starting from order 5
  const remoteMembers =
    data && data.status === 'success' && data.data && data.data['Team Members']
      ? data.data['Team Members'].filter((member) => member.Order > 4)
      : [];

  const teamMembers = [...localMembers, ...remoteMembers];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 800);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const tableWrapper = document.querySelector(`.${styles.teamTableWrapper}`);
    if (tableWrapper) {
      setTableHeight(tableWrapper.offsetHeight);
    }
  }, [teamMembers]);

  const getImagePath = (index) => {
    if (index < 4) {
      // For local members, use the image path directly
      return localMembers[index].image;
    } else {
      // For remote members, use the provided image path or a placeholder
      return teamMembers[index].image || '/api/placeholder/400/400';
    }
  };

  const handleCellClick = (member, index) => {
    if (isMobile) {
      setExpandedRow(expandedRow === index ? null : index);
    } else {
      setSelectedMember(member);
      setSelectedIndex(index);
    }
  };

  const renderMobileView = () => {
    return teamMembers.map((member, index) => (
      <div key={index} className={styles.mobileTeamMemberWrapper}>
        <div
          className={`${styles.mobileTeamMember} ${expandedRow === index ? styles.expanded : ''}`}
          onClick={() => handleCellClick(member, index)}
        >
          <div className={styles.memberInfo}>
            <p className={styles.name}>{member.Name}</p>
            <p className={styles.desig}>{member.Designation}</p>
            <div className={styles.socialLinks}>
              {member.linkedin && (
                <a href={member.linkedin} target="_blank" rel="noopener noreferrer">
                  <button className={styles.socialButton}>in</button>
                </a>
              )}
            </div>
          </div>
          <ExpandIcon isExpanded={expandedRow === index} />
        </div>
        <div className={`${styles.mobileExpandedContent} ${expandedRow === index ? styles.expanded : ''}`}>
          <div className={styles.expandedImageContainer}>
            {member.image ? (
              <Image
                src={getImagePath(index)}
                alt={member.Name}
                width={300}
                height={200}
                style={{ objectFit: 'contain' }}
                className={styles.memberImage}
              />
            ) : (
              <Graphicfg className={styles.memberImage} />
            )}
          </div>
          <p className={styles.expandedOneLiner}>{member['One-Liner']}</p>
        </div>
      </div>
    ));
  };

  const renderTableRows = () => {
    const rows = [];
    for (let i = 0; i < teamMembers.length; i += 2) {
      const isLastRow = i >= teamMembers.length - 2;
      rows.push(
        <tr key={i} className={styles.tableRow}>
          {renderCell(teamMembers[i], i)}
          {i + 1 < teamMembers.length
            ? renderCell(teamMembers[i + 1], i + 1)
            : isLastRow && teamMembers.length % 2 !== 0 && teamMembers.length > 4
            ? renderKnowMoreCell()
            : null}
        </tr>
      );
    }
    return rows;
  };

  const renderCell = (member, index) => (
    <td
      key={index}
      className={`${styles.teamMember} ${selectedIndex === index ? styles.selectedMember : ''}`}
      onClick={() => handleCellClick(member, index)}
    >
      <div className={styles.memberInfo}>
        <p className={styles.name}>{member.Name}</p>
        <p className={styles.desig}>{member.Designation}</p>
        <div className={styles.socialLinks}>
          {member.linkedin && (
            <a href={member.linkedin} target="_blank" rel="noopener noreferrer">
              <button className={styles.socialButton}>in</button>
            </a>
          )}
        </div>
      </div>
    </td>
  );

  const renderKnowMoreCell = () => (
    <td className={`${styles.teamMember} ${styles.knowMoreCell}`}>
      <Button href="/about-yali#team">{genericButtonText}</Button>
    </td>
  );

  return (
    <div className={styles.teamsLpContainer}>
      <div className={styles.teamTableWrapper}>
        {isMobile ? (
          <div className={styles.mobileTeamList}>
            {renderMobileView()}
            {teamMembers.length > 0 && (
              <div className={styles.mobileViewAllButtonWrapper}>
                <Button href="/about-yali#team">{genericButtonText}</Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <table className={styles.teamTable}>
              <tbody>{renderTableRows()}</tbody>
            </table>
            {(teamMembers.length === 4 || (teamMembers.length > 4 && teamMembers.length % 2 === 0)) && (
              <div className={styles.viewAllButtonWrapper}>
                <Button href="/about-yali#team">{genericButtonText}</Button>
              </div>
            )}
          </>
        )}
      </div>
      {!isMobile && (
        <div className={styles.teamDescription}>
          {selectedMember ? (
            <header className={styles.headerSec}>
              <div className={styles.memberImageContainer}>
                {selectedMember.image ? (
                  <Image
                    src={getImagePath(teamMembers.indexOf(selectedMember))}
                    alt={selectedMember.Name}
                    className={styles.memberImage}
                    width={300}
                    height={300}
                    style={{ objectFit: 'contain' }}
                  />
                ) : (
                  <Graphicfg className={styles.memberImage} />
                )}
              </div>
              <h3 className={styles.selectedMemberName}>{selectedMember.Name}</h3>
              <p className={styles.selectedMemberDesignation}>{selectedMember.Designation}</p>
              <p className={styles.selectedMemberOneLiner}>{selectedMember['One-Liner']}</p>
            </header>
          ) : (
            <div className={styles.defaultDisplay}>
              <TeamsDefaultSVG className={styles.defaultSVG} />
              <p className={styles.defaultText}>Select a team member to view details</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamsLPComponent;
