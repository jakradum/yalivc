'use client';

import { useState } from 'react';
import s from './dashboard.module.css';
import { ScrollX } from './ScrollX';

// The LP table, sortable by any column. Sorting happens in the browser on rows the
// page already loaded, so it costs no extra Supabase reads. Click a heading to sort
// by it; click it again to reverse. Unrated LPs stay at the bottom either way.
const COLUMNS = [
  { key: 'lp', label: 'LP', heading: 'name', dir: 1, words: ['A to Z', 'Z to A'], value: (r) => (r.name || r.email).toLowerCase() },
  { key: 'visits', label: 'Visits', heading: 'visits', num: true, dir: -1, words: ['most first', 'fewest first'], value: (r) => r.visits },
  { key: 'time', label: 'Total time', heading: 'time on portal', num: true, dir: -1, words: ['most first', 'least first'], value: (r) => r.seconds },
  { key: 'avg', label: 'Avg per visit', heading: 'time per visit', num: true, dir: -1, words: ['most first', 'least first'], value: (r) => r.avgSeconds },
  { key: 'last', label: 'Last seen', heading: 'last seen', dir: -1, words: ['latest first', 'earliest first'], value: (r) => r.lastMs },
  { key: 'downloaded', label: 'Downloaded', heading: 'downloads', dir: -1, words: ['most first', 'fewest first'], value: (r) => r.files.length || (r.downloaded ? 1 : 0) },
  { key: 'rating', label: 'Latest rating', heading: 'rating', num: true, dir: -1, words: ['highest first', 'lowest first'], value: (r) => r.rating },
  { key: 'companies', label: 'Company pages opened', heading: 'company pages opened', dir: -1, words: ['most first', 'fewest first'], value: (r) => r.companyCount },
];

export function LpTable({ rows }) {
  const [sort, setSort] = useState({ key: 'time', dir: -1 });
  const col = COLUMNS.find((c) => c.key === sort.key);

  const sorted = [...rows].sort((a, b) => {
    const x = col.value(a);
    const y = col.value(b);
    if (x == null || y == null) return x == null ? (y == null ? 0 : 1) : -1; // blanks last
    if (x !== y) return (x < y ? -1 : 1) * sort.dir;
    return b.seconds - a.seconds;
  });

  const pick = (c) => setSort((cur) => (cur.key === c.key ? { key: c.key, dir: -cur.dir } : { key: c.key, dir: c.dir }));

  return (
    <>
      <div className={s.panelHead}><h2 className={s.h2}>LPs, by {col.heading}</h2><span className={s.count}>{rows.length}</span></div>
      <ScrollX>
        <table className={s.table}>
          <thead>
            <tr>
              {COLUMNS.map((c) => {
                const on = c.key === sort.key;
                return (
                  <th key={c.key} className={c.num ? s.num : undefined} aria-sort={on ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}>
                    <button type="button" className={on ? s.sortOn : s.sort} onClick={() => pick(c)}>
                      {c.label}
                      {on ? <span className={s.sortDir}>{c.words[sort.dir === c.dir ? 0 : 1]}</span> : null}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.email}>
                <td>
                  <div className={s.lpName}>{r.name || r.email}</div>
                  {r.name ? <div className={s.lpEmail}>{r.email}</div> : null}
                </td>
                <td className={s.num}>{r.visits}</td>
                <td className={s.num}>{r.time}</td>
                <td className={s.num}>{r.avg}</td>
                <td>{r.ago}<span className={s.muted}>{`  ${r.when}`}</span></td>
                <td className={s.wrap}>{r.files.length ? r.files.join('; ') : r.downloaded ? 'Yes' : <span className={s.muted}>No</span>}</td>
                <td className={s.num}>{r.rating == null ? <span className={s.muted}>Not rated</span> : `${r.rating} / 10`}</td>
                <td className={s.wrap}>{r.companies || <span className={s.muted}>None</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollX>
    </>
  );
}
