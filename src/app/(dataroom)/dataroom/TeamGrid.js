'use client';
import { useState } from 'react';
import styles from './dataroom.module.css';

const DEPARTMENTS = [
  { label: 'Advisory', value: 'advisory' },
  { label: 'Investments', value: 'investments' },
  { label: 'Operations', value: 'operations' },
];

function ArrowIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 7L7 1M7 1H2M7 1V6" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const isSunil = (m) => m.name?.toLowerCase().includes('sunil');
const isOpsOther = (m) => m.department === 'operations' && !isSunil(m);

function RegularCard({ m }) {
  const profileUrl = m.enableTeamPage && m.slug ? `/about-yali/${m.slug}` : null;
  return (
    <div className={styles.drTeamCard}>
      <div className={styles.drTeamPhoto}>
        {m.photo && <img src={m.photo} alt={m.name} className={styles.drTeamImg} />}
        <div className={styles.drTeamNameOverlay}>
          <div className={styles.drTeamName}>{m.name}</div>
          <span className={styles.drTeamRole}>{m.role}</span>
        </div>
        {(m.emailId || m.linkedIn) && (
          <div className={styles.drTeamContactLinks}>
            {m.emailId && (
              <a href={`mailto:${m.emailId}`} className={styles.drTeamContactIcon} title={`Email ${m.name}`} aria-label={`Email ${m.name}`}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none"/>
                  <path d="M1.5 3.5L8 9L14.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </a>
            )}
            {m.linkedIn && (
              <a href={m.linkedIn} target="_blank" rel="noopener noreferrer" className={styles.drTeamContactIcon} title={`${m.name} on LinkedIn`} aria-label={`${m.name} on LinkedIn`}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.3" fill="none"/>
                  <path d="M4 6.5V12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  <circle cx="4" cy="4.5" r="0.8" fill="currentColor"/>
                  <path d="M7.5 6.5V12M7.5 9C7.5 7.619 8.619 6.5 10 6.5C11.381 6.5 12.5 7.619 12.5 9V12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </a>
            )}
          </div>
        )}
        {profileUrl && (
          <a href={profileUrl} target="_blank" rel="noopener noreferrer" className={styles.drTeamViewProfile}>
            <span className={styles.drTeamViewLabel}>View profile</span>
            <ArrowIcon />
          </a>
        )}
      </div>
      <div className={styles.drTeamContent}>
        {m.oneLiner
          ? <p className={styles.drTeamOneLiner}>{m.oneLiner}</p>
          : <div className={styles.drTeamPattern} />}
      </div>
    </div>
  );
}

function OpsGroupCard({ members }) {
  return (
    <div className={styles.drTeamCard}>
      <div className={styles.drTeamOpsGroup}>
        <div className={styles.drTeamOpsGroupTitle}>Operations team</div>
        {members.map(m => (
          <div key={m._id} className={styles.drTeamOpsTile}>
            <span className={styles.drTeamOpsTileName}>{m.name}</span>
            <span className={styles.drTeamOpsTileRole}>{m.role}</span>
          </div>
        ))}
      </div>
      <div className={styles.drTeamContent}>
        <div className={styles.drTeamPattern} />
      </div>
    </div>
  );
}

export default function TeamGrid({ members }) {
  const [activeDept, setActiveDept] = useState(null);

  const filtered = activeDept
    ? members.filter(m => m.department === activeDept)
    : members;

  // Build render list: collapse all ops-non-Sunil into one group cell at their first position
  const opsOthers = filtered.filter(isOpsOther);
  const renderItems = [];
  let groupInserted = false;
  for (const m of filtered) {
    if (isOpsOther(m)) {
      if (!groupInserted) {
        renderItems.push({ type: 'ops-group' });
        groupInserted = true;
      }
    } else {
      renderItems.push({ type: 'card', member: m });
    }
  }

  const COLS = 3;
  const remainder = renderItems.length % COLS;
  const ghostCount = remainder === 0 ? 0 : COLS - remainder;

  return (
    <>
      {/* ── Department filters ── */}
      <div className={styles.drTeamFilters}>
        <button
          className={`${styles.drTeamFilter} ${styles.drTeamFilterAll}${!activeDept ? ` ${styles.drTeamFilterAllActive}` : ''}`}
          onClick={() => setActiveDept(null)}
        >
          All
        </button>
        <div className={styles.drTeamFilterGroup}>
          {DEPARTMENTS.map(({ label, value }) => (
            <button
              key={value}
              className={`${styles.drTeamFilter}${activeDept === value ? ` ${styles.drTeamFilterActive}` : ''}`}
              onClick={() => setActiveDept(activeDept === value ? null : value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className={styles.drTeamGrid}>
        {renderItems.map((item, idx) =>
          item.type === 'ops-group'
            ? <OpsGroupCard key="ops-group" members={opsOthers} />
            : <RegularCard key={item.member._id} m={item.member} />
        )}
        {Array.from({ length: ghostCount }).map((_, i) => (
          <div key={`ghost-${i}`} className={styles.drTeamGhostCard} aria-hidden="true" />
        ))}
      </div>
    </>
  );
}
