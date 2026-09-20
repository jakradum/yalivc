import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { TEAM_COOKIE } from '@/lib/teamSession';
import { teamAreas, teamPrefix } from '@/decks/auth';
import { SignOutButton } from '../builder/SignOutButton';

export const metadata = { title: 'Asset builder — Yali Team', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const mono = 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)';
const sans = 'var(--font-inter, "Inter", Arial, sans-serif)';

const TILES = {
  letters: { eyebrow: 'Finance', title: 'Letters', body: 'Generate and print official correspondence on Yali letterhead. Create a letter in Sanity, then open it here to save as PDF.', path: '/letters/' },
  builder: { eyebrow: 'Beta', title: 'Other assets', body: 'The investor deck editor and the creative studio: LinkedIn carousels, emailers, one-pagers and more, composed with Claude within brand guardrails.', path: '/builder/' },
};

// Hub behind the team page's "Asset builder" card. Each person sees only the
// areas they may open; someone with a single area is sent straight to it, so
// Letters-only users never see the builder at all.
export default async function AssetBuilderHub() {
  const prefix = await teamPrefix();
  const { email, areas } = teamAreas((await cookies()).get(TEAM_COOKIE)?.value);
  if (!email) redirect(`${prefix}/sign-in?next=${encodeURIComponent(`${prefix}/asset-builder/`)}`);
  if (!areas.length) redirect(`${prefix}/sign-in?denied=assets`);
  if (areas.length === 1) redirect(`${prefix}${TILES[areas[0]].path}`);

  return (
    <div style={{ fontFamily: sans, minHeight: '100vh', background: 'linear-gradient(135deg, #f8f7f5 0%, #e4dfd8 50%, #d8d2cb 100%)', color: '#363636' }}>
      <style>{`
        .hub-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 560px) { .hub-grid { grid-template-columns: 1fr; } }
        .hub-card:hover > div { background: #fff; }
      `}</style>
      <div style={{ background: '#830d35', height: 52, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14, borderBottom: '1px solid #363636', boxSizing: 'border-box' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <a href={`${prefix}/`} style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <img src="/favicon.svg" alt="Yali" style={{ height: 22, width: 'auto', filter: 'brightness(0) invert(1)', display: 'block' }} />
        </a>
        <span style={{ width: 1, height: 16, background: 'rgba(239,239,239,0.25)' }} />
        <span style={{ fontFamily: mono, fontSize: 13, color: '#efefef', marginRight: 'auto' }}>Asset builder</span>
        <span style={{ fontFamily: mono, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{email}</span>
        <SignOutButton />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 52px)', padding: '40px 24px', boxSizing: 'border-box' }}>
        <div style={{ width: '100%', maxWidth: 640 }}>
          <div className="hub-grid">
            {areas.map((a) => (
              <a key={a} className="hub-card" href={`${prefix}${TILES[a].path}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ border: '1px solid #363636', borderTop: '3px solid #830d35', background: 'rgba(255,255,255,0.88)', padding: '28px 24px', height: '100%', boxSizing: 'border-box' }}>
                  <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#830d35', marginBottom: 14 }}>{TILES[a].eyebrow}</div>
                  <div style={{ fontFamily: mono, fontSize: 18, fontWeight: 400, color: '#363636', marginBottom: 12, lineHeight: 1.3 }}>{TILES[a].title}</div>
                  <p style={{ fontSize: 13, color: '#595959', lineHeight: 1.7, margin: 0 }}>{TILES[a].body}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
