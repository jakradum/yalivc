import { getAllLetters } from '@/lib/sanity-queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Letters — Yali Team' };

const mono = 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)';
const sans = 'var(--font-inter, "Inter", Arial, sans-serif)';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function LettersIndexPage() {
  const letters = await getAllLetters();

  return (
    <div style={{ fontFamily: sans, minHeight: '100vh', background: 'linear-gradient(135deg, #f8f7f5 0%, #e4dfd8 50%, #d8d2cb 100%)', color: '#363636' }}>
      <div style={{
        background: '#830d35', height: 52,
        display: 'flex', alignItems: 'center',
        padding: '0 28px', gap: 14,
        boxSizing: 'border-box',
      }}>
        <a href="/team/" style={{ display: 'flex', alignItems: 'center', height: '100%', textDecoration: 'none', flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.svg" alt="Yali" style={{ height: 22, width: 'auto', filter: 'brightness(0) invert(1)', display: 'block' }} />
        </a>
        <span style={{ width: 1, height: 16, background: 'rgba(239,239,239,0.25)', flexShrink: 0 }} />
        <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 400, color: '#efefef' }}>Letters</span>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#830d35', marginBottom: 12 }}>
          Yali Partners LLP
        </div>
        <div style={{ fontFamily: mono, fontSize: 22, fontWeight: 400, color: '#363636', marginBottom: 32 }}>
          Official Letters
        </div>

        {letters.length === 0 ? (
          <p style={{ fontFamily: sans, fontSize: 13, color: '#595959' }}>No letters yet. Create one in Sanity Studio under Letterhead Documents.</p>
        ) : (
          <div>
            {letters.map((letter) => (
              <a
                key={letter.slug?.current}
                href={`/team/letters/${letter.slug?.current}/`}
                style={{ textDecoration: 'none', display: 'block', marginBottom: 12 }}
              >
                <div style={{
                  border: '1px solid #363636',
                  background: 'rgba(255,255,255,0.88)',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 16,
                }}>
                  <div>
                    <div style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color: '#363636', marginBottom: 4 }}>
                      {letter.subject}
                    </div>
                    <div style={{ fontFamily: sans, fontSize: 11, color: '#888' }}>
                      {[letter.reference, letter.signatory?.name].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: '#888', flexShrink: 0 }}>
                    {formatDate(letter.date)}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #c8c0b4' }}>
          <p style={{ fontFamily: sans, fontSize: 12, color: '#888', lineHeight: 1.7 }}>
            To create a new letter, open Sanity Studio at{' '}
            <a href="https://yali.vc/console" style={{ color: '#830d35' }}>yali.vc/console</a>{' '}
            and create a new Letterhead Document. Once saved, click the letter above to open the print preview.
          </p>
        </div>
      </div>
    </div>
  );
}
