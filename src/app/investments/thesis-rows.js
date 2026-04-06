'use client';

import { useState, useRef } from 'react';
import invStyles from './investments.module.css';

function parseStat(stat) {
  const match = stat.match(/^(\D*)([\d,]+\.?\d*)(.*)$/);
  if (!match) return null;
  const prefix = match[1];
  const numStr = match[2];
  const suffix = match[3];
  const value = parseFloat(numStr.replace(/,/g, ''));
  const decimalPlaces = numStr.includes('.') ? numStr.split('.')[1].length : 0;
  const useComma = numStr.includes(',');
  return { prefix, value, suffix, decimalPlaces, useComma };
}

function formatStat(current, parsed) {
  let numStr;
  if (parsed.decimalPlaces > 0) {
    numStr = current.toFixed(parsed.decimalPlaces);
  } else {
    const rounded = Math.round(current);
    numStr = parsed.useComma ? rounded.toLocaleString('en-US') : String(rounded);
  }
  return `${parsed.prefix}${numStr}${parsed.suffix}`;
}

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

function ThesisRow({ row, isLast }) {
  const [displayStat, setDisplayStat] = useState(row.stat);
  const animRef = useRef(null);
  const parsed = parseStat(row.stat);

  const handleMouseEnter = () => {
    if (!parsed) return;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const start = performance.now();
    const duration = 900;
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplayStat(formatStat(parsed.value * easeOut(progress), parsed));
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayStat(row.stat);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  };

  const handleMouseLeave = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setDisplayStat(row.stat);
  };

  const rowClass = row.isOdd
    ? (isLast ? invStyles.thesisRowOddLast : invStyles.thesisRowOdd)
    : (isLast ? invStyles.thesisRowEvenLast : invStyles.thesisRowEven);

  const textBlock = (
    <div className={row.isOdd ? invStyles.thesisText : invStyles.thesisTextRight}>
      <div className={invStyles.thesisSector}>{row.sector}</div>
      <h3 className={invStyles.thesisHeadline}>{row.headline}</h3>
      <p className={invStyles.thesisBody}>{row.body}</p>
    </div>
  );

  const statBlock = (
    <div className={row.isOdd ? invStyles.thesisStatOdd : invStyles.thesisStatEven}>
      <strong className={invStyles.thesisStatValue}>{displayStat}</strong>
      <div className={invStyles.thesisStatLabel}>{row.statLabel}</div>
    </div>
  );

  return (
    <div
      className={rowClass}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {row.isOdd ? <>{textBlock}{statBlock}</> : <>{statBlock}{textBlock}</>}
    </div>
  );
}

export function ThesisRows({ rows }) {
  return (
    <>
      {rows.map((row, i) => (
        <ThesisRow key={row.sector} row={row} isLast={i === rows.length - 1} />
      ))}
    </>
  );
}
