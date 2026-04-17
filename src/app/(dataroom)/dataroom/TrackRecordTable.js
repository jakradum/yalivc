'use client';
import { useState, useMemo } from 'react';
import styles from './dataroom.module.css';

function stripNickname(name) {
  if (!name) return '—';
  // strip anything in single quotes (straight ' or curly ' ') wherever it appears
  return name.replace(/\s*['\u2018][^'\u2019']*['\u2019]/g, '').trim() || name;
}

function formatMoney(money) {
  if (!money || money.value == null) return '—';
  const { currency, value } = money;
  if (currency === 'INR') {
    if (value >= 1e7) return `₹${(value / 1e7).toFixed(2)} Cr`;
    if (value >= 1e5) return `₹${(value / 1e5).toFixed(2)} L`;
    return `₹${value}`;
  }
  if (currency === 'USD') {
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
    return `$${value}`;
  }
  return `${value}`;
}

function TrackStatusBadge({ status }) {
  if (!status) return <span>—</span>;
  return <span className={styles.trackStatus} data-status={status}>{status}</span>;
}

const investorOrder = (name) => {
  if (!name) return 99;
  const lower = name.toLowerCase();
  if (lower.includes('mathew')) return 0;
  if (lower.includes('ganapathy')) return 1;
  return 2;
};

export default function TrackRecordTable({ records, exitValueAsOfDate, hiddenFunds }) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('desc');
  const [filterInvestor, setFilterInvestor] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);

  const visibleRecords = useMemo(() => {
    if (!hiddenFunds || hiddenFunds.length === 0) return records;
    return records.filter(r => !hiddenFunds.includes(r.investmentOrg));
  }, [records, hiddenFunds]);

  const investors = useMemo(() => {
    const names = [...new Set(visibleRecords.map(r => r.investorName).filter(Boolean))];
    return names.sort((a, b) => investorOrder(a) - investorOrder(b));
  }, [visibleRecords]);

  const statuses = useMemo(() => {
    return [...new Set(visibleRecords.map(r => r.status).filter(Boolean))].sort();
  }, [visibleRecords]);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  const sortIndicator = (col) => {
    if (sortCol !== col) return <span className={styles.sortIndicator}>↕</span>;
    return <span className={styles.sortIndicator}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const filtered = useMemo(() => {
    return visibleRecords.filter(r => {
      if (filterInvestor && r.investorName !== filterInvestor) return false;
      if (filterStatus && r.status !== filterStatus) return false;
      return true;
    });
  }, [visibleRecords, filterInvestor, filterStatus]);

  const sorted = useMemo(() => {
    const base = [...filtered];
    if (!sortCol) {
      // Default: Mathew first, Gani second, then by year desc
      return base.sort((a, b) => {
        const io = investorOrder(a.investorName) - investorOrder(b.investorName);
        if (io !== 0) return io;
        return (b.year || 0) - (a.year || 0);
      });
    }
    return base.sort((a, b) => {
      let av, bv;
      if (sortCol === 'year') { av = a.year || 0; bv = b.year || 0; }
      if (sortCol === 'irr') { av = a.irr ?? -Infinity; bv = b.irr ?? -Infinity; }
      if (sortCol === 'status') { av = a.status || ''; bv = b.status || ''; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortCol, sortDir]);

  return (
    <div>
      <div className={styles.filterRow}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Investor</span>
          <button
            className={`${styles.filterPill} ${!filterInvestor ? styles.filterPillActive : ''}`}
            onClick={() => setFilterInvestor(null)}
          >All</button>
          {investors.map(name => (
            <button
              key={name}
              className={`${styles.filterPill} ${filterInvestor === name ? styles.filterPillActive : ''}`}
              onClick={() => setFilterInvestor(filterInvestor === name ? null : name)}
            >
              {name.split(' ')[0]}
            </button>
          ))}
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Status</span>
          <button
            className={`${styles.filterPill} ${!filterStatus ? styles.filterPillActive : ''}`}
            onClick={() => setFilterStatus(null)}
          >All</button>
          {statuses.map(s => (
            <button
              key={s}
              className={`${styles.filterPill} ${filterStatus === s ? styles.filterPillActive : ''}`}
              onClick={() => setFilterStatus(filterStatus === s ? null : s)}
            >{s}</button>
          ))}
        </div>
      </div>

      <div className={styles.trackTableWrap}>
        <table className={styles.trackTable}>
          <colgroup>
            <col /><col /><col /><col /><col />
            <col /><col /><col /><col /><col />
          </colgroup>
          <thead>
            <tr>
              <th className={styles.trackTh}>Investor</th>
              <th className={styles.trackTh}>Company</th>
              <th className={styles.trackTh}>Fund / Org</th>
              <th className={`${styles.trackTh} ${styles.trackThSortable}`} onClick={() => handleSort('year')}>
                Year {sortIndicator('year')}
              </th>
              <th className={styles.trackTh}>Sector</th>
              <th className={styles.trackTh}>Amount Invested</th>
              <th className={`${styles.trackTh} ${styles.trackThSortable}`} onClick={() => handleSort('status')}>
                Status {sortIndicator('status')}
              </th>
              <th className={styles.trackTh}>Exit Year</th>
              <th className={styles.trackTh}>
                Exit Value
                {exitValueAsOfDate && <span className={styles.trackThFineprint}>as on {exitValueAsOfDate}</span>}
              </th>
              <th className={`${styles.trackTh} ${styles.trackThSortable}`} onClick={() => handleSort('irr')}>
                IRR {sortIndicator('irr')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r._id}>
                <td className={styles.trackTd}>{stripNickname(r.investorName)}</td>
                <td className={styles.trackTd}>{stripNickname(r.investeeName)}</td>
                <td className={styles.trackTd}>{r.investmentOrg || '—'}</td>
                <td className={styles.trackTd}>{r.year || '—'}</td>
                <td className={styles.trackTd}>{r.sector || '—'}</td>
                <td className={styles.trackTd}>{formatMoney(r.amountInvested)}</td>
                <td className={styles.trackTd}><TrackStatusBadge status={r.status} /></td>
                <td className={styles.trackTd}>{r.exitYear || '—'}</td>
                <td className={styles.trackTd}>{formatMoney(r.exitAmountOrValuation)}</td>
                <td className={styles.trackTd}>{r.irr != null ? `${r.irr}%` : '—'}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={10} className={styles.trackTd}>No records match the selected filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
