'use client';

import { useState } from 'react';
import styles from './dataroom.module.css';
import TrackRecordTable from './TrackRecordTable';

export default function TrackRecordRow({ records }) {
  const [expanded, setExpanded] = useState(false);

  function handleClick(e) {
    if (window.innerWidth < 768) {
      e.preventDefault();
      setExpanded(prev => !prev);
    }
    // desktop: navigate to /dataroom/track-record as normal
  }

  return (
    <>
      <tr className={styles.drTr} style={{ cursor: 'pointer' }} onClick={handleClick}>
        <td className={styles.drTd}>
          Track record
          <span className={styles.drMobileChevron}>{expanded ? ' ▴' : ' ▾'}</span>
        </td>
        <td className={styles.drTd} />
        <td className={styles.drTdActions}>
          <a href="/dataroom/track-record" className={styles.drAction}>View →</a>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={3} className={styles.drTdInline}>
            <TrackRecordTable records={records} />
          </td>
        </tr>
      )}
    </>
  );
}
