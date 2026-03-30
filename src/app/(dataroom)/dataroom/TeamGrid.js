'use client';
import { useState } from 'react';
import styles from './dataroom.module.css';
import TeamModal from './TeamModal';

export default function TeamGrid({ members }) {
  const [openMember, setOpenMember] = useState(null);

  return (
    <>
      <div className={styles.teamGrid}>
        {members.map((m) => (
          <div key={m._id} className={styles.teamCard} onClick={() => setOpenMember(m)} style={{ cursor: 'pointer' }}>
            {m.photo && (
              <img src={m.photo} alt={m.name} className={styles.teamPhoto} />
            )}
            <div className={styles.teamName}>{m.name}</div>
            <div className={styles.teamRole}>{m.role}</div>
            <button
              className={styles.teamViewProfile}
              onClick={(e) => { e.stopPropagation(); setOpenMember(m); }}
            >
              View profile
            </button>
          </div>
        ))}
      </div>

      {openMember && (
        <TeamModal
          member={openMember}
          onClose={() => setOpenMember(null)}
        />
      )}
    </>
  );
}
