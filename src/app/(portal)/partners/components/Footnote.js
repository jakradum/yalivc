'use client';

import { useState } from 'react';
import styles from '../partners.module.css';

// Only very long footnotes collapse: they show their first sentence and a
// "Read more" toggle. Anything shorter is always shown in full.
const LONG_FOOTNOTE = 280;

// First sentence, but never a stub cut short by an abbreviation ("Pvt. Ltd.")
function firstSentence(text) {
  const re = /[.!?](\s|$)/g;
  let m;
  while ((m = re.exec(text))) {
    if (m.index >= 60) return text.slice(0, m.index + 1);
  }
  return text;
}

export default function Footnote({ marker, text }) {
  const [open, setOpen] = useState(false);
  const long = typeof text === 'string' && text.length > LONG_FOOTNOTE;
  const lead = long ? firstSentence(text) : text;
  const collapsible = long && lead.length < text.length;
  return (
    <p className={styles.tableFootnote}>
      {marker ? <sup>{marker}</sup> : null} {collapsible && !open ? lead : text}
      {collapsible && (
        <button type="button" className={styles.footnoteToggle} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? 'Show less' : 'Read more'}
        </button>
      )}
    </p>
  );
}
