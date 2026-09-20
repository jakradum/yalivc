import { headers } from 'next/headers';
import { requireDeckUser } from '@/decks/auth';
import { ASSETS, TEMPLATES, assetStatus } from '@/decks/builder/assets';
import { FORMATS } from '@/creative/formats';
import { ExportPdfButton } from './ExportPdfButton';
import { SignOutButton } from './SignOutButton';
import s from './home.module.css';
import '@/decks/design-system/fonts.css';
import '@/decks/design-system/tokens.css';

export const metadata = { robots: 'noindex, nofollow', title: 'Builder' };
export const dynamic = 'force-dynamic';

const fmt = (iso) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// Served at team.yali.vc/builder/ behind the Yali Microsoft sign-in.
export default async function BuilderHome() {
  const email = await requireDeckUser();
  // On the team subdomain the proxy serves these at the root; locally they live under /team.
  const host = (await headers()).get('host') || '';
  const prefix = /^(localhost|127\.0\.0\.1)/.test(host) ? '/team' : '';
  const assets = await Promise.all(ASSETS.map(async (a) => ({ ...a, status: await assetStatus(a) })));

  return (
    <div className={`deck-root ${s.page}`}>
      <header className={s.bar}>
        <a className={s.back} href={`${prefix}/asset-builder/`}>← Asset builder</a>
        <span className={s.title}>OTHER ASSETS</span>
        <span className={s.who}>{email}</span>
        <SignOutButton />
      </header>

      <main className={s.main}>
        <section aria-labelledby="assets-h">
          <h1 id="assets-h" className={s.h}>Assets</h1>
          <div className={s.grid}>
            {assets.map((a) => (
              <article key={a.id} className={s.card}>
                <div className={s.cardTop}>
                  <span className={s.kind}>{TEMPLATES[a.kind].title}</span>
                  <span className={`${s.badge} ${a.status.hasDraft ? s.badgeDraft : ''}`}>
                    {a.status.hasDraft ? 'UNPUBLISHED CHANGES' : a.status.hasPublished ? 'PUBLISHED' : 'DEFAULT (NO EDITS)'}
                  </span>
                </div>
                <h2 className={s.cardTitle}>{a.title}</h2>
                <p className={s.desc}>{a.description}</p>
                <dl className={s.meta}>
                  <div><dt>Slides</dt><dd>{a.status.slideCount}{a.status.hidden ? ` (+${a.status.hidden} hidden)` : ''}</dd></div>
                  <div><dt>Canvas</dt><dd>{TEMPLATES[a.kind].canvas.label}</dd></div>
                  <div>
                    <dt>Last edit</dt>
                    <dd>{a.status.lastEdit ? `${fmt(a.status.lastEdit.at)} · ${a.status.lastEdit.by?.split('@')[0]}` : '—'}</dd>
                  </div>
                </dl>
                <div className={s.actions}>
                  <a className={`${s.btn} ${s.btnPrimary}`} href={`${prefix}${TEMPLATES[a.kind].editorPath}/`}>Open builder</a>
                  <a className={s.btn} href={prefix + a.previewPath} target="_blank" rel="noopener noreferrer">View published</a>
                  {a.status.hasDraft ? (
                    <a className={s.btn} href={prefix + a.draftPreviewPath} target="_blank" rel="noopener noreferrer">View draft</a>
                  ) : null}
                  <ExportPdfButton deckId={a.deckId} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="create-h">
          <h2 id="create-h" className={s.h}>Create</h2>
          <div className={s.grid}>
            <article className={s.card}>
              <div className={s.cardTop}>
                <span className={s.kind}>Any creative asset</span>
                <span className={`${s.badge} ${s.badgeDraft}`}>BETA</span>
              </div>
              <h3 className={s.cardTitle}>Creative studio</h3>
              <p className={s.desc}>
                Describe an asset and Claude composes it from brand-safe blocks — free-flowing layout, with guardrails on
                colour, type, spacing, images, links, contrast and numbers. Nothing is saved yet: download the result.
              </p>
              <dl className={s.meta}>
                <div><dt>Formats</dt><dd>{Object.values(FORMATS).map((f) => f.label).join(' · ')}</dd></div>
              </dl>
              <div className={s.actions}>
                <a className={`${s.btn} ${s.btnPrimary}`} href={`${prefix}/builder/creative/`}>Open studio</a>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
