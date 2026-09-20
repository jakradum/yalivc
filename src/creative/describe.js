import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

// Looks at an uploaded picture so nobody has to type its metadata: what kind of
// image it is, a short neutral alt text, and whether it shows people. That alt
// text is also all the composing model knows about the picture (it never sees
// pixels), so it describes the SCENE and never names anyone; the person can edit
// it in the studio. Any failure falls back to a filename-derived guess.
const MODEL = 'claude-haiku-4-5-20251001';
const PROMPT = `Describe this image for a design tool. Reply with JSON only, no other text:
{"kind":"photo"|"logo"|"graphic","alt":"<one short sentence, max 110 chars>","people":true|false}
- kind: "logo" for a company logo or wordmark; "graphic" for a chart, diagram or illustration; otherwise "photo".
- alt: describe what is visible (the setting, the number of people, the action, any legible on-screen text like an event name). For a logo, write "<name shown> logo". NEVER name or guess who any person is.
- people: true if any person's face or body is clearly visible.`;

export function fallbackDescription(filename = '') {
  const base = String(filename).replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').trim();
  const isLogo = /logo|mark|wordmark/i.test(base);
  return { kind: isLogo ? 'logo' : 'photo', alt: (base ? `${base}` : 'Uploaded picture').slice(0, 110), people: false, guessed: true };
}

export async function describeImage(buf, mediaType, filename) {
  if (!process.env.ANTHROPIC_API_KEY) return fallbackDescription(filename);
  try {
    const res = await new Anthropic().messages.create({
      model: MODEL,
      max_tokens: 250,
      messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: mediaType, data: buf.toString('base64') } }, { type: 'text', text: PROMPT }] }],
    });
    const text = res.content.find((b) => b.type === 'text')?.text || '';
    const j = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
    const kind = ['photo', 'logo', 'graphic'].includes(j.kind) ? j.kind : 'photo';
    const alt = String(j.alt || '').trim().slice(0, 160);
    if (!alt) throw new Error('empty alt');
    return { kind, alt, people: j.people === true, guessed: false };
  } catch (err) {
    console.error('[creative describe]', err.message);
    return fallbackDescription(filename);
  }
}
