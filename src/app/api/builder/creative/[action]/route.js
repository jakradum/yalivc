import { NextResponse } from 'next/server';
import { getDeckUser, isPartnersHost, DECK_SESSION_COOKIE } from '@/decks/auth';
import { FORMATS } from '@/creative/formats';
import { newAsset } from '@/creative/engine';
import { validateAsset } from '@/creative/validate';
import { runCreativeAgent } from '@/creative/agent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const notFound = () => new NextResponse('Not found', { status: 404 });
const MAX_PROMPT = 2000;
const MAX_DOC_BYTES = 200_000;

// Stateless: the asset lives in the browser and comes back on every call, so
// nothing is stored yet. Same gate as the deck routes — /api/* skips the
// proxy, so host and internal session are re-checked here; denials are a bare 404.
export async function POST(request, { params }) {
  const host = request.headers.get('host') || '';
  const email = getDeckUser(request.cookies.get(DECK_SESSION_COOKIE)?.value);
  if (!isPartnersHost(host) || !email) return notFound();

  const { action } = await params;
  if (action !== 'generate') return notFound();

  const body = await request.json().catch(() => ({}));
  const prompt = String(body.prompt || '').trim().slice(0, MAX_PROMPT);
  if (!prompt) return NextResponse.json({ error: 'Describe what to make or change.' }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured.' }, { status: 500 });

  let doc = body.doc;
  if (doc) {
    if (JSON.stringify(doc).length > MAX_DOC_BYTES) return NextResponse.json({ error: 'Asset is too large.' }, { status: 413 });
    const v = validateAsset(doc);
    if (!v.ok) return NextResponse.json({ error: `The current asset is invalid: ${v.errors[0].path} ${v.errors[0].msg}` }, { status: 422 });
  } else {
    if (!FORMATS[body.format]) return NextResponse.json({ error: `Unknown format. Options: ${Object.keys(FORMATS).join(', ')}` }, { status: 400 });
    doc = newAsset({ format: body.format, brand: 'yali', title: 'Untitled asset' });
  }

  try {
    const out = await runCreativeAgent(doc, prompt, Array.isArray(body.history) ? body.history : []);
    return NextResponse.json({ doc: out.doc, reply: out.reply, validation: out.validation, calls: out.calls });
  } catch (err) {
    console.error('[builder/creative]', err);
    return NextResponse.json({ error: 'Generation failed. Nothing was changed.' }, { status: 500 });
  }
}
