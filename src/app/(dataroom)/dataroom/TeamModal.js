'use client';
import { useState, useEffect } from 'react';
import { PortableText } from '@portabletext/react';
import styles from './TeamModal.module.css';

export default function TeamModal({ member, onClose }) {
  const [patternIndex] = useState(() => Math.floor(Math.random() * 7) + 1);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const patternClass = styles[`pattern${patternIndex}`];

  return (
    <div
      className={`${styles.overlay} ${styles.overlayActive}`}
      onClick={handleOverlayClick}
    >
      <div className={styles.modal}>
        {/* LEFT: PHOTO PANEL */}
        <div className={styles.photoCol}>
          <div className={`${styles.photoBg} ${patternClass}`} />
          <div className={styles.portrait}>
            {member.photo && (
              <img src={member.photo} alt={member.name} />
            )}
          </div>
        </div>

        {/* RIGHT: CONTENT PANEL */}
        <div className={styles.content}>
          <button className={styles.closeBtn} onClick={onClose}>×</button>

          <div className={styles.name}>{member.name}</div>
          <div className={styles.role}>{member.role}</div>
          <div className={styles.divider} />

          <div className={styles.bio}>
            {member.dataRoomBio?.length > 0
              ? <PortableText value={member.dataRoomBio} />
              : member.bio
                ? <p>{member.bio}</p>
                : null
            }
          </div>

          {member.previousEmployers?.length > 0 && (
            <>
              <div className={styles.prevLabel}>Previously at</div>
              <div className={styles.logos}>
                {member.previousEmployers.map((emp, i) => (
                  <div key={i} className={styles.logoPill}>
                    {emp.logoUrl
                      ? <img src={emp.logoUrl} alt={emp.companyName} />
                      : <span>{emp.companyName}</span>
                    }
                  </div>
                ))}
              </div>
            </>
          )}

          <div className={styles.footer}>
            {member.linkedIn && (
              <a
                href={member.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.linkedin}
              >
                LinkedIn <span>↗</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
