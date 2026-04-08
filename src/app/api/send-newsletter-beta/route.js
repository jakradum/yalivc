import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { writeClient } from '@/lib/sanity';

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Portable text → HTML ────────────────────────────────────────────────────

function marksToHtml(text, marks = []) {
  let out = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  for (const mark of marks) {
    if (mark === 'strong') out = `<strong>${out}</strong>`;
    else if (mark === 'em') out = `<em>${out}</em>`;
    else if (mark === 'code') out = `<code style="font-family:'Courier New',Courier,monospace;background:#f5f5f5;padding:2px 6px;font-size:13px;">${out}</code>`;
  }
  return out;
}

function spansToHtml(spans, markDefs = []) {
  return (spans || []).map((span) => {
    if (span._type === 'span') {
      const activeLinkDef = (span.marks || [])
        .map((m) => markDefs.find((d) => d._key === m))
        .find(Boolean);
      const plainMarks = (span.marks || []).filter(
        (m) => !markDefs.some((d) => d._key === m)
      );
      let html = marksToHtml(span.text || '', plainMarks);
      if (activeLinkDef?.href) {
        html = `<a href="${activeLinkDef.href}" style="color:#830d35;text-decoration:none;" target="${activeLinkDef.blank ? '_blank' : '_self'}">${html}</a>`;
      }
      return html;
    }
    return '';
  }).join('');
}

function blocksToHtml(blocks = []) {
  if (!blocks.length) return '';
  const markDefs = [];
  for (const b of blocks) {
    if (b.markDefs) markDefs.push(...b.markDefs);
  }

  const rows = [];
  let listBuffer = [];
  let listType = null;

  const flushList = () => {
    if (!listBuffer.length) return;
    const tag = listType === 'number' ? 'ol' : 'ul';
    rows.push(`<${tag} style="margin:0 0 16px 0;padding-left:24px;">${listBuffer.join('')}</${tag}>`);
    listBuffer = [];
    listType = null;
  };

  for (const block of blocks) {
    if (block._type !== 'block') {
      flushList();
      continue;
    }
    const content = spansToHtml(block.children, markDefs);
    const style = block.style || 'normal';

    if (block.listItem) {
      if (listType && listType !== block.listItem) flushList();
      listType = block.listItem;
      listBuffer.push(`<li style="margin-bottom:6px;font-family:Arial,sans-serif;font-size:15px;color:#363636;line-height:1.75;">${content}</li>`);
      continue;
    }

    flushList();

    if (style === 'h2') {
      rows.push(`<h2 style="font-family:'Courier New',Courier,monospace;font-size:18px;font-weight:500;margin:24px 0 10px;color:#363636;line-height:1.3;">${content}</h2>`);
    } else if (style === 'h3') {
      rows.push(`<h3 style="font-family:'Courier New',Courier,monospace;font-size:15px;font-weight:500;margin:20px 0 8px;color:#363636;line-height:1.3;">${content}</h3>`);
    } else if (style === 'blockquote') {
      rows.push(`<blockquote style="margin:16px 0;padding:0 0 0 16px;border-left:2px solid #830d35;"><p style="margin:0;font-family:Arial,sans-serif;font-size:15px;color:#666;font-style:italic;line-height:1.65;">${content}</p></blockquote>`);
    } else {
      rows.push(`<p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:15px;line-height:1.75;color:#363636;">${content}</p>`);
    }
  }

  flushList();
  return rows.join('\n');
}

// ─── Section renderers ────────────────────────────────────────────────────────

function sectionLabel(text) {
  return `<p style="font-family:'Courier New',Courier,monospace;font-size:16px;font-weight:500;letter-spacing:0.04em;text-transform:uppercase;color:#830d35;margin:0 0 14px 0;line-height:1.2;">${text}</p>`;
}

function renderSection(section) {
  const type = section._type;
  const wrapper = (label, content) =>
    `<div style="padding:28px 0 0 0;">${sectionLabel(label)}${content}</div>`;

  if (type === 'openingNote') {
    const body = blocksToHtml(section.body);
    const attr = section.author?.name
      ? `<p style="font-family:Arial,sans-serif;font-size:14px;color:#830d35;margin:12px 0 0 0;">— ${section.author.name}</p>`
      : '';
    return `<div style="padding:28px 0 0 0;">${body}${attr}</div>`;
  }

  if (type === 'essay') {
    const body = blocksToHtml(section.body);
    const attr = section.author?.name
      ? `<p style="font-family:Arial,sans-serif;font-size:14px;color:#830d35;margin:12px 0 0 0;">— ${section.author.name}</p>`
      : '';
    return wrapper(section.title || 'Essay', body + attr);
  }

  if (type === 'portfolioSpotlight') {
    const label = section.company?.name
      ? `PORTFOLIO · ${section.company.name}`
      : (section.sectionTitle || 'PORTFOLIO SPOTLIGHT');
    return wrapper(label, blocksToHtml(section.body));
  }

  if (type === 'guestColumn') {
    const byline = [section.guestTitle, section.guestCompany].filter(Boolean).join(' · ');
    const meta = section.guestName
      ? `<p style="font-family:'Courier New',Courier,monospace;font-size:13px;font-weight:500;color:#363636;margin:0 0 2px 0;">${section.guestName}</p>${byline ? `<p style="font-family:Arial,sans-serif;font-size:13px;color:#830d35;margin:0 0 12px 0;">${byline}</p>` : ''}`
      : '';
    return wrapper(section.sectionTitle || 'GUEST', meta + blocksToHtml(section.body));
  }

  if (type === 'radar') {
    const items = (section.items || []).map((item) =>
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
         <tr>
           <td style="font-family:'Courier New',Courier,monospace;font-size:13px;font-weight:500;color:#363636;">${item.technology || ''}</td>
           ${item.contributor?.name ? `<td align="right" style="font-family:Arial,sans-serif;font-size:12px;color:#830d35;">${item.contributor.name}</td>` : ''}
         </tr>
         <tr>
           <td colspan="2" style="font-family:Arial,sans-serif;font-size:12px;color:#666;line-height:1.55;padding-top:2px;">${item.oneLiner || ''}</td>
         </tr>
       </table>`
    ).join('');
    return wrapper(section.sectionTitle || 'ON OUR RADAR', items);
  }

  if (type === 'reading') {
    const items = (section.items || []).map((item) =>
      `<div style="margin-bottom:14px;">
         <a href="${item.url || '#'}" style="font-family:'Courier New',Courier,monospace;font-size:13px;color:#830d35;text-decoration:none;display:block;margin-bottom:4px;" target="_blank">${item.title || ''} ↗</a>
         ${item.blurb ? `<p style="font-family:Arial,sans-serif;font-size:12px;color:#888;line-height:1.55;margin:0;">${item.blurb}</p>` : ''}
       </div>`
    ).join('');
    return wrapper(section.sectionTitle || 'READING LIST', items);
  }

  if (type === 'freeform') {
    return wrapper(section.title || '', blocksToHtml(section.body));
  }

  return '';
}

// ─── Email template ───────────────────────────────────────────────────────────

const SUBSCRIBE_URL = 'https://yali.vc/newsletter/';

function getUnsubscribeUrl(email) {
  const token = Buffer.from(email).toString('base64');
  return `https://yali.vc/unsubscribe?token=${token}`;
}

function getYoutubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}

function buildEmail(newsletter, unsubscribeUrl) {
  const { title, edition, shortDescription, sections = [], publishedDate, podcastUrl, author, slug } = newsletter;

  const dateStr = publishedDate
    ? new Date(publishedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  const pageUrl = `https://yali.vc/newsletter/${slug?.current || ''}`;
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(title || '');
  const shareSubject = encodeURIComponent(`${title} — Yali Capital Newsletter`);
  const shareBody = encodeURIComponent(`Thought you'd find this interesting: ${pageUrl}`);

  const authorName = author?.name || null;
  // Sanity CDN URL — append crop params for square thumbnail
  const authorImageUrl = author?.image?.asset?.url
    ? `${author.image.asset.url}?w=112&h=112&fit=crop&auto=format`
    : null;

  const sectionsHtml = sections.map(renderSection).join('');

  // Episode block
  let episodeHtml = '';
  if (podcastUrl) {
    const videoId = getYoutubeId(podcastUrl);
    if (videoId) {
      episodeHtml = `
        <div style="padding:28px 0 0 0;">
          <p style="font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.1em;color:#830d35;text-transform:uppercase;margin:0 0 10px 0;">YALI CAPITAL PODCAST &middot; EP.${edition || '?'}</p>
          <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" style="display:block;text-decoration:none;">
            <img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="Watch ${title || 'episode'} on YouTube" width="552" style="display:block;width:100%;height:auto;border:0;" />
          </a>
          <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" style="font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:0.05em;color:#830d35;text-decoration:none;display:inline-block;margin-top:8px;">Watch on YouTube ↗</a>
        </div>`;
    } else {
      episodeHtml = `
        <div style="padding:28px 0 0 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <p style="font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.1em;color:#830d35;text-transform:uppercase;margin:0 0 4px 0;">YALI CAPITAL PODCAST &middot; EP.${edition || '?'}</p>
                <p style="font-family:'Courier New',Courier,monospace;font-size:13px;color:#363636;margin:0;">${title || ''}</p>
              </td>
              <td align="right" style="vertical-align:middle;padding-left:12px;white-space:nowrap;">
                <a href="${podcastUrl}" style="font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:0.05em;color:#830d35;text-decoration:none;" target="_blank">Listen ↗</a>
              </td>
            </tr>
          </table>
        </div>`;
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title || ''}</title>
  <meta name="format-detection" content="telephone=no" />
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f0f0;">
    <tr>
      <td align="center" style="padding:24px 16px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;">

          <!-- ── Forwarded / subscribe bar ── -->
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid #e0e0e0;background:#f7f7f7;text-align:center;">
              <span style="font-size:11px;font-family:Arial,sans-serif;color:#555;">
                Forwarded this?
                <a href="${SUBSCRIBE_URL}" style="color:#830d35;font-family:'Courier New',monospace;text-decoration:none;font-size:11px;" target="_blank">Subscribe here ↗</a>
              </span>
            </td>
          </tr>

          <!-- ── Masthead (crimson band) ── -->
          <tr>
            <td style="background-color:#830d35;padding:28px 24px 24px 24px;">
              ${dateStr ? `<p style="font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.1em;color:#efefef;text-transform:uppercase;margin:0 0 12px 0;">${dateStr}</p>` : ''}
              <h1 style="font-family:'Courier New',Courier,monospace;font-size:34px;font-weight:500;color:#ebde84;margin:0 0 14px 0;line-height:1.2;">${title || ''}</h1>
              ${shortDescription ? `<p style="font-family:Arial,sans-serif;font-size:16px;color:#f5edbe;line-height:1.6;margin:0 0 20px 0;">${shortDescription}</p>` : ''}
              ${authorName ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <p style="font-family:'Courier New',Courier,monospace;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#efefef;margin:0 0 2px 0;">${authorName}</p>
                    ${dateStr ? `<p style="font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.06em;color:rgba(239,239,239,0.65);margin:0;">${dateStr}</p>` : ''}
                  </td>
                  ${authorImageUrl ? `
                  <td align="right" style="vertical-align:middle;padding-left:12px;">
                    <img src="${authorImageUrl}" width="56" height="56" alt="${authorName}" style="display:block;width:56px;height:56px;object-fit:cover;border:0;" />
                  </td>` : ''}
                </tr>
              </table>` : ''}
            </td>
          </tr>

          <!-- ── Content ── -->
          <tr>
            <td style="padding:0 24px 0 24px;">
              ${sectionsHtml}
              ${episodeHtml}

              <!-- Liked this / forward -->
              <div style="padding:28px 0 0 0;">
                <p style="font-family:Arial,sans-serif;font-size:14px;color:#555;margin:0;">
                  Liked this edition?
                  <a href="mailto:?subject=${shareSubject}&body=${shareBody}" style="color:#830d35;text-decoration:none;">Forward this email.</a>
                </p>
              </div>

              <!-- Share links -->
              <div style="padding:16px 0 0 0;">
                <p style="font-family:'Courier New',Courier,monospace;font-size:10px;font-weight:600;letter-spacing:0.14em;color:#830d35;text-transform:uppercase;margin:0 0 10px 0;">Share this article</p>
                <p style="font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:0.04em;margin:0;">
                  <a href="https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}" style="color:#830d35;text-decoration:none;" target="_blank">X&nbsp;/&nbsp;Twitter</a>
                  &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                  <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}" style="color:#830d35;text-decoration:none;" target="_blank">LinkedIn</a>
                  &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                  <a href="https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}" style="color:#830d35;text-decoration:none;" target="_blank">WhatsApp</a>
                  &nbsp;&nbsp;&middot;&nbsp;&nbsp;
                  <a href="mailto:?subject=${shareSubject}&body=${shareBody}" style="color:#830d35;text-decoration:none;">Email</a>
                </p>
              </div>

              <!-- Footer strip -->
              <div style="padding:24px 0 0 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.1em;color:#830d35;text-transform:uppercase;">
                      YALI CAPITAL &middot; DEEP TECH FUND
                    </td>
                    <td align="right">
                      <a href="https://yali.vc/newsletter/" style="font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:0.05em;color:#830d35;text-decoration:none;">All editions ↗</a>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- View on web button -->
              <div style="padding:20px 0 28px 0;text-align:center;">
                <a href="${pageUrl}" target="_blank" style="font-family:'Courier New',Courier,monospace;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#830d35;text-decoration:none;border:1px solid #830d35;padding:11px 28px;display:inline-block;">View on web</a>
              </div>
            </td>
          </tr>

          <!-- ── Bottom bar ── -->
          <tr>
            <td style="background-color:#f0f0f0;padding:14px 24px;">
              <p style="font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.06em;color:#888;margin:0 0 4px 0;text-align:center;">
                &copy; Yali Capital 2026 &nbsp;|&nbsp; Bangalore, India
              </p>
              <p style="font-family:Arial,sans-serif;font-size:11px;color:#aaa;margin:0;text-align:center;">
                You received this because you subscribed at yali.vc.
                &nbsp;<a href="${unsubscribeUrl}" style="color:#830d35;text-decoration:none;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const { newsletterId } = await request.json();

    if (!newsletterId) {
      return NextResponse.json({ error: 'newsletterId is required' }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const newsletter = await writeClient.fetch(
      `*[_type == "newsletter" && _id in [$id, "drafts." + $id]][0]{
        title, edition, shortDescription, publishedDate, status,
        slug, podcastUrl,
        author->{ name, image { asset->{ url } } },
        sections[]{
          _type,
          sectionTitle, title,
          body, author->{ name },
          company->{ name },
          guestName, guestTitle, guestCompany,
          items[]{ technology, oneLiner, contributor->{ name }, title, url, blurb }
        }
      }`,
      { id: newsletterId },
      { perspective: 'previewDrafts' }
    );

    if (!newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }

    const betaSubscribers = await writeClient.fetch(
      `*[_type == "newsletterSubscriber" && beta == true && unsubscribed != true]{email}`,
      {},
      { perspective: 'previewDrafts' }
    );

    if (!betaSubscribers.length) {
      return NextResponse.json({ error: 'No beta subscribers found' }, { status: 400 });
    }

    const subject = `Yali Capital Newsletter #${newsletter.edition || '?'} — ${newsletter.title}`;

    // Build one personalised email object per subscriber (unique unsubscribe token)
    const emailObjects = betaSubscribers.map((s) => {
      const unsubscribeUrl = getUnsubscribeUrl(s.email);
      return {
        from: 'Yali Capital Newsletter <tattva@yali.vc>',
        to: [s.email],
        subject,
        html: buildEmail(newsletter, unsubscribeUrl),
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      };
    });

    // Send in batches of 100
    const BATCH_SIZE = 100;
    for (let i = 0; i < emailObjects.length; i += BATCH_SIZE) {
      const batch = emailObjects.slice(i, i + BATCH_SIZE);
      const { error } = await resend.batch.send(batch);
      if (error) {
        console.error('Resend batch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      sent: betaSubscribers.length,
      recipients: betaSubscribers.map((s) => s.email),
    });
  } catch (err) {
    console.error('send-newsletter-beta error:', err);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
