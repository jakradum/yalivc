import { NextResponse } from 'next/server';
import { getDeckUser, isBuilderHost, DECK_SESSION_COOKIE } from '@/decks/auth';
import { FORMATS } from '@/creative/formats';
import { newAsset } from '@/creative/engine';
import { validateAsset } from '@/creative/validate';
import { runCreativeAgent } from '@/creative/agent';
import { getBrand } from '@/creative/brands';
import { ASSET_KINDS, GROUNDS, cleanLibrary } from '@/creative/library';
import { writeClient } from '@/lib/sanity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const notFound = () => new NextResponse('Not found', { status: 404 });
const MAX_PROMPT = 2000;
const MAX_DOC_BYTES = 200_000;
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // Vercel's request-body limit is ~4.5MB
const PREFIX = getBrand('yali').images.sanityPrefix;

// Identify the file by its bytes, not its name or claimed type.
function sniff(buf) {
  if (buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return { type: 'image/png', ext: 'png' };
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { type: 'image/jpeg', ext: 'jpg' };
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return { type: 'image/webp', ext: 'webp' };
  return null;
}

// Uploads a picture to the Sanity asset store (tagged source: creative-studio,
// so studio uploads can be found and cleaned up) and returns the library entry
// the studio keeps. Alt text and usage flags are REQUIRED here, once, so the
// AI never has to describe a picture it can't see.
async function upload(request, email) {
  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!file || typeof file === 'string') return NextResponse.json({ error: 'No file received.' }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: 'Image is over 4MB.' }, { status: 413 });
  const buf = Buffer.from(await file.arrayBuffer());
  const kind = sniff(buf);
  if (!kind) return NextResponse.json({ error: 'Use a PNG, JPEG or WebP image.' }, { status: 415 });

  const meta = {
    kind: String(form.get('kind') || ''),
    alt: String(form.get('alt') || '').trim().slice(0, 160),
    description: String(form.get('description') || '').trim().slice(0, 300),
    noCrop: form.get('noCrop') === 'true',
    people: form.get('people') === 'true',
    ground: String(form.get('ground') || 'any'),
  };
  if (!ASSET_KINDS.includes(meta.kind)) return NextResponse.json({ error: 'Say what this is: photo, logo or graphic.' }, { status: 400 });
  if (!meta.alt) return NextResponse.json({ error: 'Alt text is required — describe the picture in a few words.' }, { status: 400 });
  if (!GROUNDS.includes(meta.ground)) meta.ground = 'any';

  const safeName = String(file.name || 'upload').replace(/[^\w.-]+/g, '-').slice(0, 60);
  const asset = await writeClient.assets.upload('image', buf, { filename: safeName, contentType: kind.type, source: { name: 'creative-studio', id: email } });
  const dims = asset.metadata?.dimensions;
  if (!dims) return NextResponse.json({ error: 'Could not read the image.' }, { status: 422 });
  const entry = { url: asset.url, width: Math.round(dims.width), height: Math.round(dims.height), kind: meta.kind, alt: meta.alt };
  if (meta.description) entry.description = meta.description;
  if (meta.noCrop) entry.noCrop = true;
  if (meta.people) entry.people = true;
  if (meta.kind === 'logo' && meta.ground !== 'any') entry.ground = meta.ground;
  const clean = cleanLibrary({ [asset._id]: entry }, PREFIX);
  if (!clean[asset._id]) return NextResponse.json({ error: 'That image could not be added.' }, { status: 422 });
  return NextResponse.json({ id: asset._id, asset: clean[asset._id] });
}

// Stateless: the asset lives in the browser and comes back on every call, so
// nothing is stored yet. Same gate as the deck routes — /api/* skips the
// proxy, so host and internal session are re-checked here; denials are a bare 404.
export async function POST(request, { params }) {
  const host = request.headers.get('host') || '';
  const email = getDeckUser(request.cookies.get(DECK_SESSION_COOKIE)?.value);
  if (!isBuilderHost(host) || !email) return notFound();

  const { action } = await params;
  if (action === 'upload') {
    try {
      return await upload(request, email);
    } catch (err) {
      console.error('[builder/creative upload]', err);
      return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
    }
  }
  if (action !== 'generate') return notFound();

  const body = await request.json().catch(() => ({}));
  const prompt = String(body.prompt || '').trim().slice(0, MAX_PROMPT);
  if (!prompt) return NextResponse.json({ error: 'Describe what to make or change.' }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured.' }, { status: 500 });

  let doc = body.doc;
  // The library is authoritative from the client, but rebuilt field by field
  // and restricted to Sanity asset URLs — nothing unvetted reaches the model.
  const library = cleanLibrary(body.library ?? doc?.assets, PREFIX);
  if (doc) {
    doc = { ...doc, assets: library };
    if (JSON.stringify(doc).length > MAX_DOC_BYTES) return NextResponse.json({ error: 'Asset is too large.' }, { status: 413 });
    const v = validateAsset(doc);
    if (!v.ok) return NextResponse.json({ error: `The current asset is invalid: ${v.errors[0].path} ${v.errors[0].msg}` }, { status: 422 });
  } else {
    if (!FORMATS[body.format]) return NextResponse.json({ error: `Unknown format. Options: ${Object.keys(FORMATS).join(', ')}` }, { status: 400 });
    doc = { ...newAsset({ format: body.format, brand: 'yali', title: 'Untitled asset' }), assets: library };
  }

  // "use the attached photo" with an empty library can't work: say so plainly instead of
  // letting the model guess (and offering mock-ups nobody asked for).
  const refersToPicture = /\b(attach(ed|ment)?|upload(ed)?|(this|the|my|our) (photo|picture|image|photograph))\b/i.test(prompt);
  if (refersToPicture && Object.keys(library).length === 0) {
    return NextResponse.json({
      doc,
      reply: 'I can\'t see a picture. Nothing has been added to Images yet. Choose the file, give it alt text, press "Add to library" (or just send again after filling in the alt text), then ask again.',
      validation: validateAsset(doc),
      calls: 0,
      unfinished: false,
      trace: [],
    });
  }

  try {
    const out = await runCreativeAgent(doc, prompt, Array.isArray(body.history) ? body.history : []);
    return NextResponse.json({ doc: out.doc, reply: out.reply, validation: out.validation, calls: out.calls, unfinished: out.unfinished, trace: out.trace });
  } catch (err) {
    console.error('[builder/creative]', err);
    return NextResponse.json({ error: 'Generation failed. Nothing was changed.' }, { status: 500 });
  }
}
