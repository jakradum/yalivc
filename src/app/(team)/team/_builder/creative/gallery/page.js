import Link from 'next/link';
import { requireDeckUser } from '@/decks/auth';
import { FORMATS } from '@/creative/formats';
import { FIXTURES } from '@/creative/fixtures';
import { SAMPLES } from '@/creative/fixtures/samples';
import { FREEFORM } from '@/creative/fixtures/freeform';
import { validateAsset } from '@/creative/validate';
import { compileEmail } from '@/creative/email/compile';
import { AssetPage } from '@/creative/render/AssetRenderer';
import s from './gallery.module.css';
import '@/decks/design-system/fonts.css';
import '@/decks/design-system/tokens.css';

export const metadata = { robots: 'noindex, nofollow', title: 'Creative gallery' };
export const dynamic = 'force-dynamic';

const THUMB_H = 300; // target thumbnail height for page formats

function Pages({ doc }) {
  const f = FORMATS[doc.format];
  if (f.kind === 'email') {
    return <iframe className={s.mail} title={doc.title} srcDoc={compileEmail(doc, { baseUrl: '' })} />;
  }
  const scale = Math.min(THUMB_H / f.h, 420 / f.w);
  return (
    <div className={s.pages}>
      {doc.pages.map((p) => (
        <div key={p.id} className={s.frame} style={{ width: f.w * scale, height: f.h * scale }}>
          <div style={{ zoom: scale, width: f.w }}>
            <AssetPage doc={doc} page={p} />
          </div>
        </div>
      ))}
    </div>
  );
}

const Status = ({ doc }) => {
  const r = validateAsset(doc);
  return <span className={`${s.status} ${r.ok ? s.ok : s.bad}`}>{r.ok ? 'VALID' : `${r.errors.length} ISSUE(S)`}{r.warnings.length ? ` · ${r.warnings.length} note(s)` : ''}</span>;
};

// Every format built once from real Fund II facts, then what freeform
// instructions produce. Internal-only, like the rest of the builder.
export default async function Gallery() {
  await requireDeckUser();
  return (
    <div className={`deck-root ${s.page}`}>
      <header className={s.bar}>
        <Link className={s.back} href="../">← Creative studio</Link>
        <span className={s.title}>CREATIVE GALLERY</span>
      </header>
      <main className={s.main}>
        <section>
          <h1 className={s.h}>Every format, built</h1>
          <p className={s.lede}>One sample per format, hand-built from facts already in the Fund II deck. Each is valid against the same guardrails Claude works within.</p>
          {SAMPLES.map(({ key, label }) => {
            const doc = FIXTURES[key];
            return (
              <article key={key} className={s.item}>
                <div className={s.itemHead}>
                  <h2 className={s.name}>{label}</h2>
                  <span className={s.meta}>{FORMATS[doc.format].w}{FORMATS[doc.format].h ? `×${FORMATS[doc.format].h}` : ' wide'} · {doc.pages.length} page{doc.pages.length > 1 ? 's' : ''} · exports {FORMATS[doc.format].outputs.join(', ')}</span>
                  <Status doc={doc} />
                </div>
                <Pages doc={doc} />
              </article>
            );
          })}
        </section>

        <section>
          <h1 className={s.h}>Freeform: one instruction in, an asset out</h1>
          <p className={s.lede}>Each was produced by Claude from the single instruction shown — no template, no layout supplied — within the brand tokens and guardrails.</p>
          {FREEFORM.map((ff) => (
            <article key={ff.doc.id} className={s.item}>
              <div className={s.itemHead}>
                <h2 className={s.name}>{ff.doc.title}</h2>
                <span className={s.meta}>{FORMATS[ff.doc.format].label}</span>
                <Status doc={ff.doc} />
              </div>
              <blockquote className={s.prompt}>{ff.prompt}</blockquote>
              <Pages doc={ff.doc} />
              <p className={s.reply}><b>Claude:</b> {ff.reply}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
