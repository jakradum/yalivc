"use client"
import React, { useState, useEffect } from 'react';
import { useData } from '../data/fetch component';
import fallbackData from '../data/team.json';
import styles from '../landing page styles/team.module.css';

export const TeamsLPComponent = () => {
  const { data } = useData();
  const [teamMembers, setTeamMembers] = useState(fallbackData['Team Members'] || []);

  useEffect(() => {
    if (data && data.status === 'success' && data.data && data.data['Team Members']) {
      setTeamMembers(data.data['Team Members']);
    }
  }, [data]);

  const renderTableRows = () => {
    const rows = [];
    for (let i = 0; i < teamMembers.length; i += 2) {
      const isLastOddMember = i === teamMembers.length - 1 && teamMembers.length % 2 !== 0;
      rows.push(
        <tr key={i} className={styles.tableRow}>
          <td className={`${styles.teamMember} ${isLastOddMember ? styles.fullWidth : ''}`}>
            <div className={styles.memberInfo}>
              <p className={styles.name}>{teamMembers[i].Name}</p>
              <p className={styles.desig}>{teamMembers[i].Designation}</p>
              <p>{teamMembers[i]['One-Liner']}</p>
              <div className={styles.socialLinks}>
                {teamMembers[i].linkedin && (
                  <a href={teamMembers[i].linkedin} target="_blank" rel="noopener noreferrer">
                    <button className={styles.socialButton}>in</button>
                  </a>
                )}
              </div>
            </div>
          </td>
          {!isLastOddMember && teamMembers[i + 1] && (
            <td className={styles.teamMember}>
              <div className={styles.memberInfo}>
                <p className={styles.name}>{teamMembers[i + 1].Name}</p>
                <p className={styles.desig}>{teamMembers[i + 1].Designation}</p>
                <p>{teamMembers[i + 1]['One-Liner']}</p>
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
      );
    }
    return rows;
  };

  return (
    <div className={styles.teamsLpContainer}>
      <table className={styles.teamTable}>
        <tbody>{renderTableRows()}</tbody>
      </table>
      <div className={styles.teamDescription}>
        <h2>With over 96 years of experience in lore ipsum dolor si amet.</h2>
        <p>"Ut ullamcorper risus ut suspendisse. Arcu et odio velit in morbi egestas."</p>
        <img src="/api/placeholder/400/400" alt="Team member" className={styles.teamImage} />
      </div>
    </div>
  );
};

export default TeamsLPComponent;