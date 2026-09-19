// Ports .fi-port-table/.fi-port-row. Rows come straight from `company`
// documents (name, sector, logo, investmentStatus) — status renders as a
// column, closing the same C2i-style drift gap CompanyCard closes for
// the card layout.
const STATUS_LABEL = { active: 'Active', exited: 'Exited', 'written-off': 'Written Off' };

export function PortfolioTable({ rows = [] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--deck-font-body)', fontSize: 11 }}>
      <thead>
        <tr style={{ borderBottom: 'var(--deck-border)' }}>
          <th style={{ textAlign: 'left', padding: '6px 8px', fontFamily: 'var(--deck-font-mono)', fontSize: 9 }}>Company</th>
          <th style={{ textAlign: 'left', padding: '6px 8px', fontFamily: 'var(--deck-font-mono)', fontSize: 9 }}>Sector</th>
          <th style={{ textAlign: 'right', padding: '6px 8px', fontFamily: 'var(--deck-font-mono)', fontSize: 9 }}>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name} style={{ borderBottom: '1px solid #ddd' }}>
            <td style={{ padding: '6px 8px', fontWeight: 700 }}>{row.name}</td>
            <td style={{ padding: '6px 8px', color: '#777' }}>{row.sector || '—'}</td>
            <td style={{ padding: '6px 8px', textAlign: 'right' }}>
              {STATUS_LABEL[row.investmentStatus || 'active']}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
