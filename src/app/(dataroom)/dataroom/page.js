export const dynamic = 'force-dynamic';

export default function DataroomPage() {
  return (
    <div style={{
      fontFamily: 'var(--font-jetbrains-mono, monospace)',
      padding: '3rem',
      color: '#363636',
    }}>
      <p style={{ fontSize: '0.75rem', letterSpacing: '0.1em', color: '#830D35', marginBottom: '0.5rem' }}>
        YALI CAPITAL — DATA ROOM
      </p>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 1rem' }}>
        Step 1 — Routing confirmed
      </h1>
      <p style={{ fontSize: '0.9rem', color: '#666' }}>
        Route group and middleware wired. Auth, schema, and UI coming in Steps 2–5.
      </p>
    </div>
  );
}
