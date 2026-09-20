import { NextResponse } from 'next/server';
import { DECK_IDS } from '@/decks/core/constants';
import { getDeckUser, isPartnersHost, DECK_SESSION_COOKIE } from '@/decks/auth';
import { loadDeckData } from '@/decks/data/loadDeckData';
import { catalogRefs, getDefinition } from '@/decks/builder/catalog';
import { runTool } from '@/decks/builder/engine';
import { runEditAgent } from '@/decks/builder/agent';
import { readManifest, readForEdit, saveDraft, replaceLog, publishDraft, discardDraft } from '@/decks/builder/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const notFound = () => new NextResponse('Not found', { status: 404 });
const MAX_EDITS_PER_HOUR = 20;
const MAX_PROMPT = 2000;

// Same rule as the PDF route: /api/* skips the proxy, so this re-checks
// host + internal session itself, and every denial is a bare 404.
async function loadCtx(deckId, entries) {
  let data;
  try {
    data = await loadDeckData(deckId, { dataSource: 'sanity' });
  } catch {
    data = await loadDeckData(deckId, { dataSource: 'fixture' });
  }
  return { deckId, entries: structuredClone(entries), data, log: [] };
}

function describe(deckId, m) {
  const present = new Set(m.entries.map((e) => e.ref));
  return {
    slides: m.entries.map((e) => ({ id: e.id, ref: e.ref, type: getDefinition(deckId, e.ref)?.type, overridden: Object.keys(e.props), hidden: !!e.hidden })),
    removed: catalogRefs(deckId).filter((c) => !present.has(c.ref)),
    hasDraft: m.hasDraft,
    hasPublished: m.hasPublished,
    log: m.log.map((l) => ({ key: l._key, at: l.at, by: l.by, prompt: l.prompt, summary: l.summary })).reverse().slice(0, 20),
  };
}

const logEntry = (by, prompt, summary, before) => ({
  _type: 'deckEdit',
  _key: Math.random().toString(36).slice(2, 12),
  at: new Date().toISOString(),
  by,
  prompt: prompt || '',
  summary,
  before: JSON.stringify(before),
});

export async function POST(request, { params }) {
  const host = request.headers.get('host') || '';
  const email = getDeckUser(request.cookies.get(DECK_SESSION_COOKIE)?.value);
  if (!isPartnersHost(host) || !email) return notFound();

  const { action } = await params;
  const body = await request.json().catch(() => ({}));
  const deckId = body.deckId || DECK_IDS[0];
  if (!DECK_IDS.includes(deckId)) return notFound();

  try {
    if (action === 'state') {
      return NextResponse.json(describe(deckId, await readForEdit(deckId)));
    }

    if (action === 'apply') {
      // Direct (non-AI) edits from the builder UI: [{ tool, input }].
      const m = await readForEdit(deckId);
      const ctx = await loadCtx(deckId, m.entries);
      const ops = Array.isArray(body.ops) ? body.ops.slice(0, 20) : [];
      try {
        for (const op of ops) runTool(ctx, op.tool, op.input);
      } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 422 });
      }
      if (ctx.log.length) await saveDraft(deckId, ctx.entries, logEntry(email, '', ctx.log.join('; '), m.entries));
      return NextResponse.json(describe(deckId, await readForEdit(deckId)));
    }

    if (action === 'edit') {
      const prompt = String(body.prompt || '').trim().slice(0, MAX_PROMPT);
      if (!prompt) return NextResponse.json({ error: 'Type what you want changed.' }, { status: 400 });
      if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured.' }, { status: 500 });

      const m = await readForEdit(deckId);
      const hourAgo = Date.now() - 60 * 60 * 1000;
      const recent = m.log.filter((l) => l.by === email && l.prompt && new Date(l.at).getTime() > hourAgo).length;
      if (recent >= MAX_EDITS_PER_HOUR) return NextResponse.json({ error: 'Edit limit reached (20/hour). Try again later.' }, { status: 429 });

      const ctx = await loadCtx(deckId, m.entries);
      const reply = await runEditAgent(ctx, prompt, Array.isArray(body.history) ? body.history : []);
      if (ctx.log.length) await saveDraft(deckId, ctx.entries, logEntry(email, prompt, ctx.log.join('; '), m.entries));
      return NextResponse.json({ reply, changed: ctx.log.length > 0, ...describe(deckId, await readForEdit(deckId)) });
    }

    if (action === 'undo') {
      const m = await readForEdit(deckId);
      const last = m.log[m.log.length - 1];
      if (!last?.before) return NextResponse.json({ error: 'Nothing to undo.' }, { status: 422 });
      const before = JSON.parse(last.before);
      await replaceLog(deckId, before, m.log.slice(0, -1));
      return NextResponse.json(describe(deckId, await readForEdit(deckId)));
    }

    if (action === 'publish') {
      const ok = await publishDraft(deckId);
      if (!ok) return NextResponse.json({ error: 'No draft changes to publish.' }, { status: 422 });
      return NextResponse.json(describe(deckId, await readManifest(deckId, 'draft')));
    }

    if (action === 'discard') {
      await discardDraft(deckId);
      return NextResponse.json(describe(deckId, await readManifest(deckId, 'draft')));
    }
  } catch (err) {
    console.error('[builder/deck]', action, err);
    return NextResponse.json({ error: 'Something went wrong. Nothing was published.' }, { status: 500 });
  }
  return notFound();
}
