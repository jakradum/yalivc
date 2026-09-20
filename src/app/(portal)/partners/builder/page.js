import { headers } from 'next/headers';
import { requireDeckUser } from '@/decks/auth';
import { ASSETS, TEMPLATES, assetStatus, deckLayouts } from '@/decks/builder/assets';
import { FORMATS } from '@/creative/formats';
import { ExportPdfButton } from './ExportPdfButton';
import s from './home.module.css';
import '@/decks/design-system/fonts.css';
import '@/decks/design-system/tokens.css';

export const metadata = { robots: 'noindex, nofollow', title: 'Builder' };
export const dynamic = 'force-dynamic';

const fmt = (iso) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// Served at partners.yali.vc/builder/ — linked from nowhere, same
// internal-only guard as the decks.
export default async function BuilderHome() {
  const email = await requireDeckUser();
  // On the partners subdomain the proxy serves these at the root; locally they live under /partners.
  const host = (await headers()).get('host') || '';
  const prefix = /^(localhost|127\.0\.0\.1)/.test(host) ? '/partners' : '';
  const assets = await Promise.all(ASSETS.map(async (a) => ({ ...a, status: await assetStatus(a) })));
  const layouts = await deckLayouts('fund-ii');
  const tpl = TEMPLATES.deck;

  return (
    <div className={`deck-root ${s.page}`}>
      <header className={s.bar}>
        <span className={s.title}>BUILDER</span>
        <span className={s.who}>{email}</span>
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

        <section aria-labelledby="tpl-h" className={s.tplSection}>
          <h2 id="tpl-h" className={s.h}>Templates</h2>
          <p className={s.lede}>
            An asset is built from a template: a fixed canvas, a set of layouts, and the fields each layout
            exposes. Editors and Claude fill fields, reorder, hide and add or remove existing layouts — they never
            invent layout. Layouts and fields are defined in code; the lists below are read from it, so they can’t
            drift.
          </p>

          <div className={s.tplHead}>
            <h3 className={s.tplTitle}>{tpl.title}</h3>
            <span className={s.tplMeta}>{tpl.canvas.label} · exports {tpl.exports.join(', ')} · {layouts.length} layouts</span>
          </div>

          <div className={s.layouts}>
            {layouts.map((l) => (
              <details key={l.type} className={s.layout}>
                <summary>
                  <span className={s.layoutName}>{l.type}</span>
                  <span className={s.layoutUse}>{l.slides.length} slide{l.slides.length === 1 ? '' : 's'}</span>
                </summary>
                <div className={s.layoutBody}>
                  <div className={s.used}>Used by: {l.slides.join(', ')}</div>
                  {Object.keys(l.fields).length === 0 && l.optional.length === 0 ? (
                    <div className={s.none}>No editable fields.</div>
                  ) : (
                    <ul className={s.fields}>
                      {Object.entries(l.fields).map(([k, v]) => (
                        <li key={k} className={v.startsWith('locked') ? s.locked : ''}>
                          <code>{k}</code> <span>{v}</span>
                        </li>
                      ))}
                      {l.optional.map((o) => (
                        <li key={o}><code>{o.split(' ')[0]}</code> <span>{o.slice(o.indexOf('('))}</span></li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            ))}
          </div>

          <p className={s.note}>
            To add a new asset type (a carousel, a one-pager, another client’s deck), define its template — canvas,
            layouts, fields — in code, with its data mapping and manifest. The draft, publish, undo, Claude and
            export machinery are shared.
          </p>
        </section>
      </main>
    </div>
  );
}
