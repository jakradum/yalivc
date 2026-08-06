// ─── Shared newsletter email builder ─────────────────────────────────────────
// Used by both /api/send-newsletter-beta and /api/send-newsletter

export const SUBSCRIBE_URL = 'https://yali.vc/newsletter/';

export function getUnsubscribeUrl(email) {
  const token = Buffer.from(email).toString('base64');
  return `https://yali.vc/unsubscribe?token=${token}`;
}

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
    if (block._type !== 'block') { flushList(); continue; }
    const content = spansToHtml(block.children, markDefs);
    const style = block.style || 'normal';

    if (block.listItem) {
      if (listType && listType !== block.listItem) flushList();
      listType = block.listItem;
      listBuffer.push(`<li class="eb" style="margin-bottom:6px;font-family:Arial,sans-serif;font-size:14px;color:#363636;line-height:1.75;">${content}</li>`);
      continue;
    }

    flushList();

    if (style === 'h2') {
      rows.push(`<h2 class="el" style="font-family:'Courier New',Courier,monospace;font-size:17px;font-weight:700;margin:24px 0 10px;color:#363636;line-height:1.3;">${content}</h2>`);
    } else if (style === 'h3') {
      rows.push(`<h3 class="el" style="font-family:'Courier New',Courier,monospace;font-size:14px;font-weight:700;margin:20px 0 8px;color:#363636;line-height:1.3;">${content}</h3>`);
    } else if (style === 'blockquote') {
      rows.push(`<p class="eb" style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;line-height:1.75;color:#363636;">${content}</p>`);
    } else {
      rows.push(`<p class="eb" style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;line-height:1.75;color:#363636;">${content}</p>`);
    }
  }

  flushList();
  return rows.join('\n');
}

// ─── Section renderers ────────────────────────────────────────────────────────

function sectionLabel(text) {
  return `<p class="el" style="font-family:'Courier New',Courier,monospace;font-size:14px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#830d35;margin:0 0 14px 0;line-height:1.2;">${text}</p>`;
}

function renderSection(section) {
  const type = section._type;
  const wrapper = (label, content) =>
    `<div style="padding:28px 0 0 0;border-top:1px solid #ebebeb;">${sectionLabel(label)}${content}</div>`;

  if (type === 'openingNote') {
    const body = blocksToHtml(section.body);
    // Author attribution dropped — byline avatar in header already identifies the writer
    return `<div style="padding:28px 0 0 0;">${body}</div>`;
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

function getYoutubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}

export function buildEmail(newsletter, unsubscribeUrl) {
  const { title, edition, shortDescription, sections = [], publishedDate, podcastUrl, author, slug, coverImageUrl } = newsletter;

  const dateStr = publishedDate
    ? new Date(publishedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  const pageUrl = `https://yali.vc/newsletter/${slug?.current || ''}`;
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(title || '');
  const shareSubject = encodeURIComponent(`${title} — Yali Capital Newsletter`);
  const shareBody = encodeURIComponent(`Thought you'd find this interesting: ${pageUrl}`);

  const authorName = author?.name || null;
  const authorSlug = author?.slug || null;
  const authorProfileUrl = authorSlug ? `https://yali.vc/about-yali/${authorSlug}` : null;
  const authorImageUrl = author?.photo?.asset?.url
    ? `${author.photo.asset.url}?w=72&h=72&fit=crop&auto=format`
    : null;
  const authorInitials = authorName
    ? authorName.split(' ').map(w => w[0]).slice(0, 2).join('')
    : 'Y';

  const heroImageUrl = coverImageUrl
    ? `${coverImageUrl}?w=1200&h=680&fit=crop&auto=format`
    : null;

  const sectionsHtml = sections.map(renderSection).join('');

  let episodeHtml = '';
  if (podcastUrl) {
    const videoId = getYoutubeId(podcastUrl);
    if (videoId) {
      episodeHtml = `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #ebebeb;">
          <tr><td style="padding:24px 24px 0;">
            <p style="font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.14em;color:#830d35;text-transform:uppercase;margin:0 0 10px 0;">Yali Capital Podcast &middot; Ep.${edition || '?'}</p>
            <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" style="display:block;text-decoration:none;">
              <img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="Watch on YouTube" width="552" style="display:block;width:100%;height:auto;border:0;" />
            </a>
            <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#830d35;text-decoration:none;display:inline-block;margin-top:8px;">Watch on YouTube ↗</a>
          </td></tr>
        </table>`;
    } else {
      episodeHtml = `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #ebebeb;">
          <tr><td style="padding:24px 24px 0;">
            <p style="font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.14em;color:#830d35;text-transform:uppercase;margin:0 0 4px 0;">Yali Capital Podcast &middot; Ep.${edition || '?'}</p>
            <p style="font-family:'Courier New',Courier,monospace;font-size:13px;color:#363636;margin:0 0 4px 0;">${title || ''}</p>
            <a href="${podcastUrl}" style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#830d35;text-decoration:none;" target="_blank">Listen ↗</a>
          </td></tr>
        </table>`;
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
  <style type="text/css">
    @media only screen and (max-width:600px){
      .em{width:100%!important;max-width:100%!important}
      .ep{padding-left:16px!important;padding-right:16px!important}
      .et{font-size:18px!important}
      .eb{font-size:15px!important}
      .el{font-size:12px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#e8e8e8;font-family:Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#e8e8e8;">
  <tr>
    <td align="center" style="padding:24px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <!-- Brand stripe -->
        <tr>
          <td style="background-color:#363636;padding:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:#830d35;padding:10px 14px;white-space:nowrap;vertical-align:middle;">
                  <span style="font-family:'Courier New',Courier,monospace;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;">Yali Capital</span>
                </td>
                <td style="padding:0 16px;vertical-align:middle;" align="right">
                  ${dateStr ? `<span style="font-family:'Courier New',Courier,monospace;font-size:9px;letter-spacing:0.08em;color:rgba(255,255,255,0.3);margin-right:12px;">${dateStr}</span>` : ''}
                  <span style="font-family:'Courier New',Courier,monospace;font-size:8px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#ebde84;border:1px solid rgba(235,222,132,0.25);padding:2px 8px;">Issue #${edition || '?'}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Hero image -->
        ${heroImageUrl ? `
        <tr>
          <td style="padding:0;line-height:0;background-color:#1a1a1a;background-image:repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,0.06) 39px,rgba(255,255,255,0.06) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,0.06) 39px,rgba(255,255,255,0.06) 40px);">
            <img src="${heroImageUrl}" width="600" alt="${title || ''}" style="display:block;width:100%;height:auto;border:0;mix-blend-mode:luminosity;opacity:0.82;" />
          </td>
        </tr>` : ''}

        <!-- Title + author block -->
        <tr>
          <td class="ep" style="background-color:#ffffff;padding:28px 24px 20px;border-bottom:1px solid #ebebeb;">
            <p style="font-family:'Courier New',Courier,monospace;font-size:9px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#830d35;margin:0 0 12px 0;">Newsletter &middot; Deep Tech</p>
            <h1 class="et" style="font-family:'Courier New',Courier,monospace;font-size:21px;font-weight:700;color:#363636;line-height:1.2;margin:0 0 20px 0;">${title || ''}</h1>
            ${authorName ? `
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:middle;padding-right:12px;">
                  ${authorImageUrl
                    ? `<img src="${authorImageUrl}" width="36" height="36" alt="${authorName}" style="display:block;width:36px;height:36px;border-radius:50%;border:0;" />`
                    : `<div style="width:36px;height:36px;border-radius:50%;background-color:#830d35;font-family:'Courier New',Courier,monospace;font-size:12px;font-weight:700;color:#ffffff;text-align:center;line-height:36px;">${authorInitials}</div>`
                  }
                </td>
                <td style="vertical-align:middle;">
                  ${authorProfileUrl
                    ? `<a href="${authorProfileUrl}" style="text-decoration:none;" target="_blank">`
                    : ''}
                  <p style="font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#363636;margin:0;">${authorName}</p>
                  ${authorProfileUrl ? `</a>` : ''}
                </td>
              </tr>
            </table>` : ''}
          </td>
        </tr>

        <!-- Short description lede -->
        ${shortDescription ? `
        <tr>
          <td class="ep" style="background-color:#fafafa;padding:20px 24px;border-bottom:1px solid #ebebeb;">
            <p class="eb" style="font-family:Arial,sans-serif;font-size:14px;color:#666666;line-height:1.65;margin:0;">${shortDescription}</p>
          </td>
        </tr>` : ''}

        <!-- Email intro -->
        <tr>
          <td class="ep" style="background-color:#ffffff;padding:24px 24px 0;border-bottom:1px solid #ebebeb;">
            <p class="eb" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.8;color:#363636;margin:0;">If you're wondering why you're reading this, it's because you subscribed on yali.vc. Share this newsletter with someone who might enjoy it. This is the first edition of 'Tattva' from Yali Capital, our newsletter on science, tech, and their intersection with the world of venture capital.</p>
          </td>
        </tr>

        <!-- Sections -->
        <tr>
          <td class="ep" style="background-color:#ffffff;padding:0 24px;">
            ${sectionsHtml}
            ${episodeHtml}
          </td>
        </tr>

        <!-- Outro + view on web -->
        <tr>
          <td class="ep" style="background-color:#ffffff;padding:28px 24px;border-top:1px solid #ebebeb;">
            <p class="eb" style="font-family:Arial,sans-serif;font-size:13px;color:#555555;line-height:1.7;margin:0 0 20px 0;">That is it for Edition #${edition || '?'}. If you found this useful, forward it to someone working at the frontier.</p>
            <a href="${pageUrl}" target="_blank" style="font-family:'Courier New',Courier,monospace;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#830d35;text-decoration:none;border:1px solid #830d35;padding:10px 24px;display:inline-block;">View on web</a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td class="ep" style="background-color:#363636;padding:14px 24px;">
            <p style="font-family:'Courier New',Courier,monospace;font-size:9px;letter-spacing:0.06em;color:rgba(255,255,255,0.25);margin:0 0 4px 0;text-align:center;">&copy; Yali Capital 2026 &nbsp;|&nbsp; Bangalore, India</p>
            <p style="font-family:Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.2);margin:0;text-align:center;">
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

// ─── Shared Sanity newsletter query ──────────────────────────────────────────

export const NEWSLETTER_QUERY = `*[_type == "newsletter" && _id in [$id, "drafts." + $id]][0]{
  title, edition, shortDescription, publishedDate, status,
  slug, podcastUrl,
  "coverImageUrl": coverImage.asset->url,
  author->{ name, "slug": slug.current, photo { asset->{ url } } },
  sections[]{
    _type,
    sectionTitle, title,
    body, author->{ name },
    company->{ name },
    guestName, guestTitle, guestCompany,
    items[]{ technology, oneLiner, contributor->{ name }, title, url, blurb }
  }
}`;

// ─── Shared batch sender ─────────────────────────────────────────────────────

export async function batchSend(resend, newsletter, subscribers) {
  const subject = `Yali Capital Newsletter #${newsletter.edition || '?'} — ${newsletter.title}`;

  const emailObjects = subscribers.map((s) => {
    const unsubscribeUrl = getUnsubscribeUrl(s.email);
    return {
      from: 'Yali Capital Newsletter <newsletter@yali.vc>',
      to: [s.email],
      subject,
      html: buildEmail(newsletter, unsubscribeUrl),
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    };
  });

  const BATCH_SIZE = 100;
  for (let i = 0; i < emailObjects.length; i += BATCH_SIZE) {
    const { error } = await resend.batch.send(emailObjects.slice(i, i + BATCH_SIZE));
    if (error) throw new Error(error.message);
  }

  return subscribers.length;
}
