export const metadata = { title: 'Yali Team Portal' };

export default function TeamPage() {
  return (
    <div style={{ fontFamily: 'var(--font-inter, sans-serif)', minHeight: '100vh', background: '#efefef', color: '#363636' }}>
      {/* Header */}
      <div style={{ background: '#830d35', padding: '24px 40px 28px' }}>
        <div style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(235,222,132,0.8)', marginBottom: 14 }}>
          Yali Capital
        </div>
        <h1 style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 26, fontWeight: 400, color: '#efefef', margin: 0, lineHeight: 1.2 }}>
          Team Portal
        </h1>
      </div>

      {/* Full-width divider */}
      <div style={{ borderTop: '1px solid #363636' }} />

      {/* Cards */}
      <div style={{ padding: '48px 40px', maxWidth: 720 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Leave / WFH card */}
          <a href="/team-apps/request-form.html" style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              border: '1px solid #363636',
              background: '#ffffff',
              padding: '32px 28px',
              cursor: 'pointer',
              height: '100%',
              boxSizing: 'border-box',
            }}>
              <div style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#830d35', marginBottom: 16 }}>
                All employees
              </div>
              <div style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 20, fontWeight: 400, color: '#363636', marginBottom: 14, lineHeight: 1.3 }}>
                Leave &amp; WFH
              </div>
              <p style={{ fontSize: 13, color: '#595959', lineHeight: 1.7, margin: 0 }}>
                Apply for paid leave, sick/casual leave, or log a work-from-home day. Your balances are shown after selecting your name.
              </p>
            </div>
          </a>

          {/* Admin dashboard card */}
          <a href="/team-apps/dashboard.html" style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              border: '1px solid #363636',
              background: '#ffffff',
              padding: '32px 28px',
              cursor: 'pointer',
              height: '100%',
              boxSizing: 'border-box',
            }}>
              <div style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#830d35', marginBottom: 16 }}>
                Approvers only
              </div>
              <div style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 20, fontWeight: 400, color: '#363636', marginBottom: 14, lineHeight: 1.3 }}>
                Admin Dashboard
              </div>
              <p style={{ fontSize: 13, color: '#595959', lineHeight: 1.7, margin: 0 }}>
                Review and approve leave requests, check team balances, and export reports. Sign in with your Yali Microsoft account.
              </p>
            </div>
          </a>

        </div>
      </div>
    </div>
  );
}
