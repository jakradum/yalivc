'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from '../landing-page-styles/team.module.css';

const DEPT_LABELS = {
  investments: 'Investments',
  advisory: 'Advisors',
  operations: 'Operations',
};

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function groupByDept(members) {
  const map = new Map();
  const order = [];
  for (const m of members) {
    const d = m.department || 'other';
    if (!map.has(d)) { map.set(d, []); order.push(d); }
    map.get(d).push(m);
  }
  return order.map(d => ({ dept: d, members: map.get(d) }));
}

function MagRings() {
  return (
    <svg className={styles.tsMagRings} width="260" height="260" viewBox="0 0 260 260" fill="none">
      <circle cx="160" cy="100" r="55"  stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 6" />
      <circle cx="160" cy="100" r="95"  stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="3 8" />
      <circle cx="160" cy="100" r="135" stroke="rgba(255,255,255,0.025)" strokeWidth="1" strokeDasharray="3 10" />
    </svg>
  );
}

const DEPTS = [
  { key: null,           label: 'All' },
  { key: 'investments',  label: 'Investments' },
  { key: 'advisory',     label: 'Advisors' },
  { key: 'operations',   label: 'Operations' },
];

export const TeamsLPComponent = ({ teamMembers = [] }) => {
  const router = useRouter();
  const [modal, setModal] = useState(null);
  const [switching, setSwitching] = useState(false);
  const [activeDept, setActiveDept] = useState(null);

  const openModal = useCallback((member) => {
    if (modal?._id === member._id) return;
    if (modal) {
      setSwitching(true);
      setTimeout(() => {
        setModal(member);
        setSwitching(false);
      }, 180);
    } else {
      setModal(member);
    }
  }, [modal]);

  const closeModal = useCallback(() => setModal(null), []);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal, closeModal]);

  if (!teamMembers.length) return null;

  const filtered = activeDept ? teamMembers.filter(m => m.department === activeDept) : teamMembers;

  return (
    <>
      <div className={styles.tsSection}>
        <div className={styles.tsFilterBar}>
          {DEPTS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`${styles.tsFilterBtn}${activeDept === key ? ` ${styles.tsFilterBtnActive}` : ''}`}
              onClick={() => setActiveDept(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={styles.tsThumbList}>
          <div className={styles.tsThumbGrid}>
            {filtered.map((m) => (
              <button
                key={m._id}
                type="button"
                className={`${styles.tsThumbCard}${modal?._id === m._id ? ` ${styles.tsThumbCardActive}` : ''}`}
                onClick={() => openModal(m)}
              >
                <div className={styles.tsThumbPhoto}>
                  {m.photo
                    ? <Image src={m.photo} alt={m.name} fill className={styles.tsThumbImg} sizes="200px" />
                    : <span className={styles.tsThumbFallback}>{getInitials(m.name)}</span>
                  }
                </div>
                <div className={styles.tsThumbMeta}>
                  <div className={styles.tsThumbName}>{m.name.split(' ')[0]}</div>
                  <div className={styles.tsThumbRole}>{m.role}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MODAL ── */}
      {modal && (
        <div className={styles.tsModalOverlay} onClick={closeModal}>
          <div
            className={`${styles.tsModalPanel}${switching ? ` ${styles.tsMagPanelSwitching}` : ''}${modal?.enableTeamPage && modal?.slug ? ` ${styles.tsModalPanelClickable}` : ''}`}
            onClick={() => {
              if (modal?.enableTeamPage && modal?.slug) {
                router.push(`/about-yali/${modal.slug?.current ?? modal.slug}`);
              }
            }}
          >
            <button type="button" className={styles.tsModalClose} onClick={(e) => { e.stopPropagation(); closeModal(); }}>×</button>
            <span className={styles.tsMagWordmark}>Yali Capital</span>
            <MagRings />

            <div className={styles.tsMagPhotoArea}>
              <div className={styles.tsMagBgName}>{modal.name?.toUpperCase()}</div>
              <div className={styles.tsMagHeadshot}>
                {modal.photo
                  ? <Image src={modal.photo} alt={modal.name} fill className={styles.tsMagHeadshotImg} sizes="200px" />
                  : <div className={styles.tsMagFallback}>{getInitials(modal.name)}</div>
                }
              </div>
            </div>

            <div className={styles.tsMagInfo}>
              <div className={styles.tsMagMemberName}>{modal.name}</div>
              <div className={styles.tsMagMemberRole}>{modal.role}</div>
              <div className={styles.tsMagRule} />
              <div className={styles.tsMagBio}>{modal.oneLiner}</div>
              {modal.linkedIn && (
                <a
                  href={modal.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.tsMagLinkedIn}
                  onClick={(e) => e.stopPropagation()}
                >
                  LinkedIn ↗
                </a>
              )}
              {modal.enableTeamPage && modal.slug && (
                <a
                  href={`/about-yali/${modal.slug?.current ?? modal.slug}`}
                  className={styles.tsMagViewProfile}
                  onClick={(e) => e.stopPropagation()}
                >
                  View profile →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeamsLPComponent;
