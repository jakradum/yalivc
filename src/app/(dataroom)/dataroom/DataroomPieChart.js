'use client';
import { useState } from 'react';
import styles from './dataroom.module.css';

export default function DataroomPieChart({ chartData, colors }) {
  const [view, setView] = useState('chart');
  const [hoveredSegment, setHoveredSegment] = useState(null);

  if (!chartData || chartData.length === 0) return null;

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  const size = 220;
  const center = size / 2;
  const radius = 90;

  const getCoords = (percent) => [
    Math.cos(2 * Math.PI * percent),
    Math.sin(2 * Math.PI * percent),
  ];

  let cumulativePercent = 0;

  return (
    <div className={styles.pieSectionWrap}>
      <div className={styles.pieToggle}>
        <button
          className={`${styles.pieToggleBtn} ${view === 'chart' ? styles.pieToggleBtnActive : ''}`}
          onClick={() => setView('chart')}
        >
          Chart
        </button>
        <button
          className={`${styles.pieToggleBtn} ${view === 'table' ? styles.pieToggleBtnActive : ''}`}
          onClick={() => setView('table')}
        >
          Table
        </button>
      </div>

      {view === 'chart' ? (
        <div className={styles.pieChartWrap}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={styles.pieChartSvg}>
            {chartData.map((segment, idx) => {
              if (segment.value <= 0) return null;
              const percent = segment.value / total;
              const startPercent = cumulativePercent;
              cumulativePercent += percent;

              const [startX, startY] = getCoords(startPercent);
              const [endX, endY] = getCoords(cumulativePercent);
              const largeArcFlag = percent > 0.5 ? 1 : 0;

              const pathData = [
                `M ${center + startX * radius} ${center + startY * radius}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${center + endX * radius} ${center + endY * radius}`,
                `L ${center} ${center}`,
              ].join(' ');

              return (
                <path
                  key={idx}
                  d={pathData}
                  fill={colors[idx % colors.length]}
                  opacity={hoveredSegment !== null && hoveredSegment !== idx ? 0.55 : 1}
                  onMouseEnter={() => setHoveredSegment(idx)}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
              );
            })}
          </svg>

          <div className={styles.pieLegend}>
            {chartData.map((segment, idx) => (
              <div
                key={idx}
                className={`${styles.pieLegendRow} ${hoveredSegment === idx ? styles.pieLegendRowActive : ''}`}
                onMouseEnter={() => setHoveredSegment(idx)}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                <span className={styles.pieLegendDot} style={{ background: colors[idx % colors.length] }} />
                <span className={styles.pieLegendName}>{segment.name}</span>
                <span className={styles.pieLegendVal}>₹{segment.value.toFixed(2)} Cr</span>
                <span className={styles.pieLegendPct}>({((segment.value / total) * 100).toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.trackTableWrap}>
          <table className={styles.trackTable}>
            <thead>
              <tr>
                <th className={styles.trackTh}>Sector</th>
                <th className={styles.trackTh}>Invested (₹ Cr)</th>
                <th className={styles.trackTh}>Share</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row, idx) => (
                <tr key={idx}>
                  <td className={styles.trackTd}>
                    <span className={styles.pieLegendDot} style={{ background: colors[idx % colors.length] }} />
                    {row.name}
                  </td>
                  <td className={styles.trackTd}>{row.value.toFixed(2)}</td>
                  <td className={styles.trackTd}>{((row.value / total) * 100).toFixed(1)}%</td>
                </tr>
              ))}
              <tr>
                <td className={`${styles.trackTd} ${styles.trackTdTotal}`}>Total</td>
                <td className={`${styles.trackTd} ${styles.trackTdTotal}`}>{total.toFixed(2)}</td>
                <td className={`${styles.trackTd} ${styles.trackTdTotal}`}>100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
