'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
// import { useData } from '../data/fetch component';
import styles from '../landing page styles/team.module.css';
import { ExpandIcon } from './icons/small icons/expandIcon';
import { TeamsDefaultSVG } from './icons/background svgs/teams default display';
import Button from './button';
import { genericButtonText } from '../page';
import { Graphicfg } from './icons/background svgs/graphicfg';
import imageLoader from '../../../image-loader';

export const TeamsLPComponent = ({ teamMembers = [] }) => {
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [tableHeight, setTableHeight] = useState(0);

  


const finalTeam = teamMembers;

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
  }, [finalTeam]);

  const getImagePath = (index) => {
    const member = finalTeam[index];
    const imagePath = member.photo || '/api/placeholder/400/400';
    if (imagePath.startsWith('http')) return imagePath;
    return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  };

  const handleCellInteraction = (member, index) => {
    if (isMobile) {
      setExpandedRow(expandedRow === index ? null : index);
    } else {
      setSelectedMember(member);
      setSelectedIndex(index);
    }
  };

  const handleCellHoverLeave = () => {
    if (!isMobile) {
      setSelectedMember(null);
      setSelectedIndex(null);
    }
  };

  const renderMobileView = () =>
    finalTeam.map((member, index) => (
      <div key={index} className={styles.mobileTeamMemberWrapper}>
        <div
          className={`${styles.mobileTeamMember} ${
            expandedRow === index ? styles.expanded : ''
          }`}
          onClick={() => handleCellInteraction(member, index)}
        >
          <div className={styles.memberInfo}>
            <p className={styles.name}>{member.name}</p>
            <p className={styles.desig}>{member.role}</p>
            <div className={styles.socialLinks}>
              {member.linkedIn && (
                <a
                  href={member.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button className={styles.socialButton}>in</button>
                </a>
              )}
            </div>
          </div>
          <ExpandIcon isExpanded={expandedRow === index} />
        </div>
        <div
          className={`${styles.mobileExpandedContent} ${
            expandedRow === index ? styles.expanded : ''
          }`}
        >
          <div className={styles.expandedImageContainer}>
            {member.photo ? (
              <Image
                loader={!member.photo?.startsWith('http') ? imageLoader : undefined}
                src={getImagePath(index)}
                alt={member.name}
                width={300}
                height={200}
                className={styles.memberImage}
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <Graphicfg className={styles.memberImage} />
            )}
          </div>
<p className={styles.expandedOneLiner}>{member.oneLiner}</p>
        </div>
      </div>
    ));

  const renderTableRows = () => {
    const rows = [];
    for (let i = 0; i < finalTeam.length; i += 2) {
      const isLastRow = i >= finalTeam.length - 2;
      rows.push(
        <tr key={i} className={styles.tableRow}>
          {renderCell(finalTeam[i], i)}
          {i + 1 < finalTeam.length
            ? renderCell(finalTeam[i + 1], i + 1)
            : isLastRow &&
              finalTeam.length % 2 !== 0 &&
              finalTeam.length > 4
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
      className={`${styles.teamMember} ${
        selectedIndex === index ? styles.selectedMember : ''
      }`}
      onMouseEnter={() => handleCellInteraction(member, index)}
      onMouseLeave={handleCellHoverLeave}
    >
      <div className={styles.memberInfo}>
        <p className={styles.name}>{member.name}</p>
        <p className={styles.desig}>{member.role}</p>
        <div className={styles.socialLinks}>
          {member.linkedIn && (
            <a
              href={member.linkedIn}
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className={styles.socialButton}>in</button>
            </a>
          )}
        </div>
      </div>
    </td>
  );

  const renderKnowMoreCell = () => (
    <td className={`${styles.teamMember} ${styles.knowMoreCell}`}>
      <Link href="/about-yali/#team" className={styles.noUnderline}>
        <Button>{genericButtonText}</Button>
      </Link>
    </td>
  );

  return (
    <div className={styles.teamsLpContainer}>
      <div className={styles.teamTableWrapper}>
        {isMobile ? (
          <div className={styles.mobileTeamList}>
            {renderMobileView()}
            {finalTeam.length > 0 && (
              <div className={styles.mobileViewAllButtonWrapper}>
                <Link href="/about-yali/#team" className={styles.noUnderline}>
                  <Button>{genericButtonText}</Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            <table className={styles.teamTable}>
              <tbody>{renderTableRows()}</tbody>
            </table>
            {(finalTeam.length === 4 || (finalTeam.length > 4 && finalTeam.length % 2 === 0)) && (
              <div className={styles.viewAllButtonWrapper}>
                <Link href="/about-yali/#team" className={styles.noUnderline}>
                  <Button>{genericButtonText}</Button>
                </Link>
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
                {selectedMember.photo ? (
                  <Image
                    loader={imageLoader}
                    src={getImagePath(finalTeam.indexOf(selectedMember))}
                    alt={selectedMember.name}
                    className={styles.memberImage}
                    width={300}
                    height={300}
                    style={{ objectFit: 'contain' }}
                  />
                ) : (
                  <Graphicfg className={styles.memberImage} />
                )}
              </div>
              <h3 className={styles.selectedMemberName}>{selectedMember.name}</h3>
              <p className={styles.selectedMemberDesignation}>{selectedMember.role}</p>
              <p className={styles.selectedMemberOneLiner}>{selectedMember.oneLiner}</p>
            </header>
          ) : (
            <div className={styles.defaultDisplay}>
              <TeamsDefaultSVG className={styles.defaultSVG} />
              <p className={styles.defaultText}>Hover over a team member to view details</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamsLPComponent;
