'use client';
import { useState } from 'react';
import styles from './dataroom.module.css';

export default function DrCollapsibleGroup({ label, children }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        id="recommendations"
        className={styles.drGroupRow}
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setOpen(o => !o)}
      >
        <td colSpan={3} className={styles.drGroupCell}>
          {open ? '▾' : '▸'} {label}
        </td>
      </tr>
      {open && children}
    </>
  );
}
