export const metadata = { title: 'Yali Team Portal' };

const mono = 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)';
const sans = 'var(--font-inter, "Inter", Arial, sans-serif)';

export default function TeamPage() {
  return (
    <div style={{ fontFamily: sans, minHeight: '100vh', background: '#efefef', color: '#363636' }}>
      <style>{`
        .team-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 560px) { .team-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* Nav bar — matches injected nav in leave/admin pages */}
      <div style={{
        background: '#830d35', height: 52,
        display: 'flex', alignItems: 'center',
        padding: '0 28px', gap: 14,
        borderBottom: '1px solid #363636',
        boxSizing: 'border-box',
      }}>
        <span style={{ fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(235,222,132,0.85)', flexShrink: 0 }}>
          Yali Capital
        </span>
        <span style={{ width: 1, height: 16, background: 'rgba(239,239,239,0.25)', flexShrink: 0 }} />
        <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 400, color: '#efefef' }}>
          Team Portal
        </span>
      </div>

      {/* Centred content */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 52px)',
        padding: '40px 24px',
        boxSizing: 'border-box',
      }}>
        <div style={{ width: '100%', maxWidth: 640 }}>
          <div className="team-grid">

            {/* Leave / WFH card */}
            <a href="/team/leave" style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{
                border: '1px solid #363636',
                borderTop: '3px solid #830d35',
                background: '#ffffff',
                padding: '28px 24px',
                height: '100%',
                boxSizing: 'border-box',
              }}>
                <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#830d35', marginBottom: 14 }}>
                  All employees
                </div>
                <div style={{ fontFamily: mono, fontSize: 18, fontWeight: 400, color: '#363636', marginBottom: 12, lineHeight: 1.3 }}>
                  Leave &amp; WFH
                </div>
                <p style={{ fontFamily: sans, fontSize: 13, color: '#595959', lineHeight: 1.7, margin: 0 }}>
                  Apply for paid or sick leave, or log a work-from-home day. Balances shown after selecting your name.
                </p>
              </div>
            </a>

            {/* Admin dashboard card */}
            <a href="/team/admin" style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{
                border: '1px solid #363636',
                borderTop: '3px solid #830d35',
                background: '#ffffff',
                padding: '28px 24px',
                height: '100%',
                boxSizing: 'border-box',
              }}>
                <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#830d35', marginBottom: 14 }}>
                  Approvers only
                </div>
                <div style={{ fontFamily: mono, fontSize: 18, fontWeight: 400, color: '#363636', marginBottom: 12, lineHeight: 1.3 }}>
                  Admin Dashboard
                </div>
                <p style={{ fontFamily: sans, fontSize: 13, color: '#595959', lineHeight: 1.7, margin: 0 }}>
                  Review and approve requests, check balances, export reports. Sign in with your Yali Microsoft account.
                </p>
              </div>
            </a>

          </div>
        </div>
      </div>
    </div>
  );
}
