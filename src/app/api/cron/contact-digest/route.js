import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';

export const maxDuration = 60;

const SANITY_PROJECT_ID = 'nt0wmty3';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2024-01-01';
const SANITY_URL = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data`;

// ─── Email templates ────────────────────────────────────────────────────────

const emailShell = (heroTitle, body) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background-color: #d0d0d0; font-family: 'Inter', Arial, sans-serif; color: #363636; padding: 40px 20px; }
  .wrapper { max-width: 560px; margin: 0 auto; background: #efefef; }
  .header { background: #363636; padding: 18px 36px; display: flex; align-items: center; justify-content: space-between; }
  .header-tag { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #ebde84; letter-spacing: 0.15em; text-transform: uppercase; }
  .hero { background: #830d35; padding: 40px 36px 36px; position: relative; overflow: hidden; }
  .hero::before { content: ''; position: absolute; top: 0; right: 0; width: 100px; height: 100px; border-left: 1px solid rgba(235,222,132,0.2); border-bottom: 1px solid rgba(235,222,132,0.2); }
  .hero-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: #ebde84; margin-bottom: 14px; }
  .hero-title { font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: 700; color: #efefef; line-height: 1.25; max-width: 380px; }
  .body { padding: 36px; font-size: 14px; line-height: 1.75; color: #363636; }
  .body p { margin-bottom: 16px; }
  .body p:last-child { margin-bottom: 0; }
  .body a { color: #830d35; }
  .footer { padding: 20px 36px 28px; border-top: 1px solid #d0d0d0; }
  .footer-disclaimer { font-size: 11px; color: #888; line-height: 1.65; margin-bottom: 10px; }
  .footer-links { font-size: 11px; color: #bbb; }
  .footer-links a { color: #bbb; text-decoration: none; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="header-tag">Contact</div>
  </div>
  <div class="hero">
    <div class="hero-title">${heroTitle}</div>
  </div>
  <div class="body">
    ${body}
  </div>
  <div class="footer">
    <p class="footer-disclaimer">
      This is an automated response. Please do not reply to this email.<br>
      To follow up, use the contact form at <a href="https://yali.vc/contact" style="color:#888">yali.vc/contact</a>.
    </p>
    <p class="footer-links">
      <a href="https://yali.vc">yali.vc</a>
      &nbsp;&middot;&nbsp;
      <a href="https://yali.vc/newsroom">Newsroom</a>
      &nbsp;&middot;&nbsp;
      <a href="https://yali.vc/contact">Contact</a>
    </p>
  </div>
</div>
</body>
</html>
`;

const messageQuote = (msg) => {
  if (!msg) return '';
  const excerpt = msg.length > 220 ? msg.slice(0, 220).trimEnd() + '...' : msg;
  return `<blockquote style="margin:0 0 24px;padding:12px 16px;border-left:3px solid #d0d0d0;background:#f5f5f5;font-size:13px;color:#595959;line-height:1.65;font-style:italic">${excerpt}</blockquote>`;
};

const TEMPLATES = {
  'press-established': {
    subject: 'Re: Your media inquiry to Yali Capital',
    html: (name, msg) => emailShell(
      "We'll be in touch shortly.",
      `<p style="margin:0 0 16px">Hi ${name},</p>
      <p style="margin:0 0 16px">Thanks for getting in touch. We have received your message:</p>
      ${messageQuote(msg)}
      <p style="margin:0 0 16px">Someone from the team will be in touch shortly.</p>
      <p style="margin:0 0 24px">Our press kit, fund announcements, and high-resolution assets are at <a href="https://yali.vc/newsroom/press-downloads" style="color:#830d35">yali.vc/newsroom/press-downloads</a>.</p>
      <p style="margin:0;color:#595959">Regards,<br>Yali Capital</p>`
    ),
  },
  'press-general': {
    subject: 'Re: Your message to Yali Capital',
    html: (name, msg) => emailShell(
      'Thanks for reaching out.',
      `<p style="margin:0 0 16px">Hi ${name},</p>
      <p style="margin:0 0 16px">Thanks for reaching out. We have received your message:</p>
      ${messageQuote(msg)}
      <p style="margin:0 0 24px">We will follow up if there is a relevant angle to discuss.</p>
      <p style="margin:0;color:#595959">Regards,<br>Yali Capital</p>`
    ),
  },
  'partnership': {
    subject: 'Re: Your message to Yali Capital',
    html: (name, msg) => emailShell(
      'Thanks for getting in touch.',
      `<p style="margin:0 0 16px">Hi ${name},</p>
      <p style="margin:0 0 16px">Thanks for getting in touch. We have received your message:</p>
      ${messageQuote(msg)}
      <p style="margin:0 0 24px">We will follow up if there is a potential fit.</p>
      <p style="margin:0;color:#595959">Regards,<br>Yali Capital</p>`
    ),
  },
};

// ─── Sanity helpers ──────────────────────────────────────────────────────────

async function fetchUnprocessed() {
  const query = encodeURIComponent(
    '*[_type == "contactSubmission" && !defined(processedAt)] | order(submittedAt asc)'
  );
  const res = await fetch(`${SANITY_URL}/query/${SANITY_DATASET}?query=${query}`, {
    headers: { Authorization: `Bearer ${process.env.SANITY_WRITE_TOKEN}` },
  });
  const { result } = await res.json();
  return result || [];
}

async function patchSubmissions(patches) {
  // patches: array of { id, fields }
  const mutations = patches.map(({ id, fields }) => ({ patch: { id, set: fields } }));
  await fetch(`${SANITY_URL}/mutate/${SANITY_DATASET}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SANITY_WRITE_TOKEN}`,
    },
    body: JSON.stringify({ mutations }),
  });
}

// ─── Digest HTML builder ─────────────────────────────────────────────────────

function buildDigestHtml(results, dateRange) {
  const legit = results.filter((r) => r.combined_score >= 0.7);
  const borderline = results.filter((r) => r.combined_score >= 0.4 && r.combined_score < 0.7);
  const noise = results.filter((r) => r.combined_score < 0.4);

  const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  const card = (r, showAutoResponded = false) => `
    <div style="margin-bottom:20px;padding:16px;border-left:3px solid #363636;background:#fafafa">
      <p style="margin:0 0 4px;font-family:monospace;font-size:13px;color:#363636">
        <strong>${r.name || '(no name)'}</strong> &middot; <a href="mailto:${r.email}" style="color:#830d35">${r.email}</a>
        &middot; <span style="text-transform:uppercase;font-size:11px;color:#595959">${r.inquiryType || ''}</span>
        &middot; <span style="color:#888;font-size:11px">${fmtDate(r.submittedAt)}</span>
      </p>
      <p style="margin:4px 0;font-size:11px;color:#595959;font-family:monospace">
        Score: ${(r.combined_score * 100).toFixed(0)}%
        (sender ${(r.sender_score * 100).toFixed(0)}% / message ${(r.message_score * 100).toFixed(0)}%)
        &middot; ${r.bucket}
      </p>
      <p style="margin:4px 0;font-size:11px;color:#595959;font-style:italic">${r.reasoning || ''}</p>
      <p style="margin:10px 0 0;font-size:13px;color:#363636;background:#fff;padding:10px;border:1px solid #e0e0e0;white-space:pre-wrap">${r.message || ''}</p>
      ${showAutoResponded && r.autoResponded ? `<p style="margin:6px 0 0;font-size:11px;color:#2e7d32;font-family:monospace">AUTO-RESPONDED: ${r.bucket} template sent</p>` : ''}
    </div>
  `;

  const section = (title, items, color, showAutoResponded = false) =>
    items.length === 0
      ? ''
      : `
    <div style="margin-bottom:32px">
      <div style="background:${color};padding:8px 14px;margin-bottom:16px">
        <span style="font-family:monospace;font-size:11px;letter-spacing:0.1em;font-weight:700;color:#fff;text-transform:uppercase">
          ${title} (${items.length})
        </span>
      </div>
      ${items.map((r) => card(r, showAutoResponded)).join('')}
    </div>
  `;

  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:680px;margin:0 auto;color:#363636">
      <div style="background:#830d35;padding:24px 28px;margin-bottom:28px">
        <p style="margin:0 0 4px;font-family:monospace;font-size:10px;letter-spacing:0.15em;color:rgba(255,255,255,0.7);text-transform:uppercase">Yali Capital</p>
        <h1 style="margin:0 0 4px;font-family:monospace;font-size:20px;color:#efefef;font-weight:400">Contact Digest</h1>
        <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.7)">${dateRange} &middot; ${results.length} submission${results.length !== 1 ? 's' : ''}</p>
      </div>

      ${section('Worth your attention', legit, '#2e7d32', true)}
      ${section('Borderline — review', borderline, '#795548', false)}
      ${section('Filtered as noise', noise, '#616161', false)}

      <p style="font-size:11px;color:#888;border-top:1px solid #e0e0e0;padding-top:12px;margin-top:24px">
        All submissions are stored in <a href="https://yali.vc/console" style="color:#830d35">Sanity Studio</a> under Contact Submissions.
      </p>
    </div>
  `;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const submissions = await fetchUnprocessed();

  if (submissions.length === 0) {
    return Response.json({ message: 'No unprocessed submissions.' });
  }

  // ── Classify with Haiku ──────────────────────────────────────────────────

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const submissionList = submissions
    .map((s, i) =>
      `[${i + 1}] _id: ${s._id}
Name: ${s.name || '(none)'}
Email: ${s.email || '(none)'}
Inquiry type: ${s.inquiryType || '(none)'}
Message: ${s.message || '(none)'}`
    )
    .join('\n\n');

  const haikuRes = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are classifying contact form submissions for Yali Capital, a deep tech venture capital firm based in Bangalore, India. The firm invests in AI, robotics, semiconductors, life sciences, aerospace, and manufacturing.

For each submission, return:
- sender_score (0.0-1.0): Is the name and email credible? gmail/yahoo/icloud are acceptable — journalists and founders often use personal email. Only penalise clearly fake addresses, disposable domains, or incoherent name/email combos.
- message_score (0.0-1.0): Does the message contain a specific, actionable request? Does it mention a real publication, company, or topic relevant to deep tech or Yali? Penalise single words, gibberish, or completely generic filler.
- combined_score: (0.35 * sender_score) + (0.65 * message_score)
- bucket: exactly one of "press-established" (press inquiry with detectable publication or outlet context), "press-general" (press inquiry, legit but vague), "partnership" (partnership inquiry, legit), "borderline" (combined 0.40-0.69), "spam" (combined below 0.40)
- reasoning: one sentence.

Return ONLY a valid JSON array, no prose, no markdown:
[{"_id":"...","sender_score":0.0,"message_score":0.0,"combined_score":0.0,"bucket":"spam","reasoning":"..."}]

Submissions:
${submissionList}`,
      },
    ],
  });

  let classifications = [];
  try {
    classifications = JSON.parse(haikuRes.content[0].text);
  } catch {
    // Haiku response unparseable — send everything to digest unclassified
    classifications = submissions.map((s) => ({
      _id: s._id,
      sender_score: 0.5,
      message_score: 0.5,
      combined_score: 0.5,
      bucket: 'borderline',
      reasoning: 'Classification unavailable — Haiku response could not be parsed.',
    }));
  }

  // Build a lookup by _id
  const classMap = Object.fromEntries(classifications.map((c) => [c._id, c]));

  // ── Auto-respond + patch Sanity ─────────────────────────────────────────

  const resend = new Resend(process.env.RESEND_API_KEY);
  const processedAt = new Date().toISOString();
  const patches = [];
  const results = [];

  for (const sub of submissions) {
    const cls = classMap[sub._id] || {
      sender_score: 0,
      message_score: 0,
      combined_score: 0,
      bucket: 'spam',
      reasoning: 'Not returned by classifier.',
    };

    let autoResponded = false;

    if (cls.combined_score >= 0.7 && TEMPLATES[cls.bucket]) {
      const tpl = TEMPLATES[cls.bucket];
      try {
        await resend.emails.send({
          from: 'Yali Capital <contact-noreply@yali.vc>',
          to: sub.email,
          subject: tpl.subject,
          html: tpl.html(sub.name?.split(' ')[0] || sub.name || 'there', sub.message),
        });
        autoResponded = true;
      } catch (err) {
        console.error(`Auto-respond failed for ${sub._id}:`, err.message);
      }
    }

    patches.push({
      id: sub._id,
      fields: {
        processedAt,
        status: 'processed',
        haikuScore: cls.combined_score,
        haikuBucket: cls.bucket,
        haikuReasoning: cls.reasoning,
        autoResponded,
      },
    });

    results.push({ ...sub, ...cls, autoResponded });
  }

  await patchSubmissions(patches);

  // ── Send digest ──────────────────────────────────────────────────────────

  const dates = submissions.map((s) => s.submittedAt).filter(Boolean).sort();
  const fmtShort = (iso) =>
    iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
  const dateRange =
    dates.length > 1
      ? `${fmtShort(dates[0])} to ${fmtShort(dates[dates.length - 1])}`
      : fmtShort(dates[0]) || processedAt.slice(0, 10);

  await resend.emails.send({
    from: 'Yali Capital <contact-noreply@yali.vc>',
    to: 'press@yali.vc',
    subject: `Contact Digest: ${dateRange} (${submissions.length} submission${submissions.length !== 1 ? 's' : ''})`,
    html: buildDigestHtml(results, dateRange),
  });

  const autoRespondedCount = results.filter((r) => r.autoResponded).length;
  return Response.json({
    processed: submissions.length,
    autoResponded: autoRespondedCount,
    dateRange,
  });
}
