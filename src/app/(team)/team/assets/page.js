import { requireTeamUser, teamPrefix } from '@/decks/auth';
import { listTeamDecks } from '@/lib/teamDecks';
import { Breadcrumbs, TEAM } from '../_components/Breadcrumbs';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Yali Assets — Yali Team' };

const mono = 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)';
const sans = 'var(--font-inter, "Inter", Arial, sans-serif)';

const day = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '');
const mb = (bytes) => `${(bytes / 1048576).toFixed(1)} MB`;

export default async function AssetsPage() {
  await requireTeamUser('assets'); // any Yali Microsoft account (the proxy checks too)
  const prefix = await teamPrefix();
  const decks = await listTeamDecks();
  const open = (path) => `${prefix}/assets/open/${path.split('/').map(encodeURIComponent).join('/')}`;

  return (
    <div style={{ fontFamily: sans, minHeight: '100vh', background: 'linear-gradient(135deg, #f8f7f5 0%, #e4dfd8 50%, #d8d2cb 100%)', color: '#363636' }}>
      <div style={{ background: '#830d35', height: 52, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14, boxSizing: 'border-box' }}>
        <a href={`${prefix}/`} style={{ display: 'flex', alignItems: 'center', height: '100%', textDecoration: 'none', flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.svg" alt="Yali" style={{ height: 22, width: 'auto', filter: 'brightness(0) invert(1)', display: 'block' }} />
        </a>
        <span style={{ width: 1, height: 16, background: '#a9536f', flexShrink: 0 }} />
        <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 400, color: '#efefef' }}>Yali Assets</span>
      </div>
      <Breadcrumbs trail={[TEAM, ['Yali Assets']]} />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ fontFamily: mono, fontSize: 22, fontWeight: 400, marginBottom: 8 }}>Yali Assets</div>
        <p style={{ fontSize: 13, color: '#595959', lineHeight: 1.7, margin: '0 0 32px' }}>
          The latest version of each Yali deck. Confidential: for the Yali team, not for distribution.
        </p>

        {decks.length === 0 ? (
          <p style={{ fontSize: 13, color: '#595959' }}>Nothing here yet.</p>
        ) : decks.map((d) => (
          <div key={d.key} style={{ border: '1px solid #363636', background: '#fff', marginBottom: 16 }}>
            <div style={{ padding: '20px 24px', display: 'flex', gap: 20, alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: mono, fontSize: 17, lineHeight: 1.3, marginBottom: 6 }}>{d.title}</div>
                {d.blurb ? <p style={{ fontSize: 13, color: '#595959', lineHeight: 1.6, margin: '0 0 10px' }}>{d.blurb}</p> : null}
                <div style={{ fontFamily: mono, fontSize: 11, color: '#7a7672' }}>
                  {[d.latest.version, day(d.latest.updated), mb(d.latest.size)].filter(Boolean).join('  ·  ')}
                </div>
              </div>
              <a href={open(d.latest.path)} target="_blank" rel="noopener" style={{ flexShrink: 0, background: '#830d35', color: '#fff', fontFamily: mono, fontSize: 12, fontWeight: 700, padding: '10px 16px', textDecoration: 'none' }}>
                Open PDF
              </a>
            </div>
            {d.earlier.length ? (
              <details style={{ borderTop: '1px solid #c0bcb8', padding: '10px 24px', fontSize: 12, color: '#595959' }}>
                <summary style={{ cursor: 'pointer', fontFamily: mono, fontSize: 11 }}>Earlier versions ({d.earlier.length})</summary>
                <div style={{ padding: '8px 0 4px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {d.earlier.map((f) => (
                    <a key={f.path} href={open(f.path)} target="_blank" rel="noopener" style={{ color: '#363636' }}>
                      {f.name}<span style={{ color: '#7a7672' }}>{`  ·  ${day(f.updated)}`}</span>
                    </a>
                  ))}
                </div>
              </details>
            ) : null}
          </div>
        ))}
      </div>
      <Breadcrumbs trail={[TEAM, ['Yali Assets']]} position="bottom" />
    </div>
  );
}
