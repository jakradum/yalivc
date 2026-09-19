// Ports Portfolio Support — cadence table + the board-position note.
export function PortfolioSupportSlide({ heading, cadences = [], note }) {
  return (
    <div style={{ padding: '24px 40px', width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ fontFamily: 'var(--deck-font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--deck-color-crimson)' }}>
        {heading}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--deck-font-body)', fontSize: 12 }}>
        <tbody>
          {cadences.map((c) => (
            <tr key={c.frequency} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '8px 10px', fontFamily: 'var(--deck-font-mono)', fontWeight: 700, width: 120 }}>{c.frequency}</td>
              <td style={{ padding: '8px 10px', color: '#555' }}>{c.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {note ? (
        <div style={{ marginTop: 'auto', fontFamily: 'var(--deck-font-body)', fontSize: 12, fontStyle: 'italic', color: 'var(--deck-color-crimson)' }}>
          {note}
        </div>
      ) : null}
    </div>
  );
}
