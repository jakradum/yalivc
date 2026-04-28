import { useFormValue } from 'sanity';

export function RedemptionLog() {
  const log = useFormValue(['redemptionLog']);

  const containerStyle = {
    padding: '4px 0',
    fontFamily: 'inherit',
    fontSize: '13px',
  };

  if (!log || log.length === 0) {
    return (
      <div style={containerStyle}>
        <p style={{ color: '#888', fontStyle: 'italic' }}>No redemptions yet.</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {log.map((entry, i) => (
        <div key={entry._key || i} style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '8px 0',
          borderBottom: '1px solid #e5e5e5',
          gap: '16px',
        }}>
          <span style={{ color: '#363636', fontWeight: 500 }}>{entry.email}</span>
          <span style={{ color: '#888', whiteSpace: 'nowrap' }}>
            {entry.redeemedAt
              ? new Date(entry.redeemedAt).toLocaleString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })
              : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}
