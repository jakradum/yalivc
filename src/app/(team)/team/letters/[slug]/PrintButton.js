'use client';

export default function PrintButton() {
  return (
    <div style={{ maxWidth: 794, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
      <button
        onClick={() => window.print()}
        style={{
          fontFamily: 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)',
          fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
          background: '#830d35', color: '#efefef', border: 'none',
          padding: '8px 20px', cursor: 'pointer',
        }}
      >
        Print / Save as PDF
      </button>
    </div>
  );
}
