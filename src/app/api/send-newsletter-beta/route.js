import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { client, writeClient } from '@/lib/sanity';

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
    else if (mark === 'code') out = `<code style="background:#f4f4f4;padding:2px 4px;border-radius:3px;font-size:0.9em;">${out}</code>`;
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
        html = `<a href="${activeLinkDef.href}" style="color:#1a1a1a;text-decoration:underline;" target="${activeLinkDef.blank ? '_blank' : '_self'}">${html}</a>`;
      }
      return html;
    }
    return '';
  }).join('');
}

function blocksToHtml(blocks = []) {
  if (!blocks.length) return '';
  const markDefs = [];
  // collect all markDefs
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
      listBuffer.push(`<li style="margin-bottom:6px;">${content}</li>`);
      continue;
    }

    flushList();

    if (style === 'h2') {
      rows.push(`<h2 style="font-size:20px;font-weight:600;margin:28px 0 12px;color:#1a1a1a;">${content}</h2>`);
    } else if (style === 'h3') {
      rows.push(`<h3 style="font-size:17px;font-weight:600;margin:22px 0 10px;color:#1a1a1a;">${content}</h3>`);
    } else if (style === 'blockquote') {
      rows.push(`<blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #d1d5db;color:#555;font-style:italic;">${content}</blockquote>`);
    } else {
      rows.push(`<p style="margin:0 0 16px;line-height:1.7;color:#333;">${content}</p>`);
    }
  }

  flushList();
  return rows.join('\n');
}

// ─── Section renderers ────────────────────────────────────────────────────────

function sectionWrapper(label, content) {
  return `
    <div style="margin:40px 0;padding-top:32px;border-top:1px solid #e5e7eb;">
      <p style="margin:0 0 20px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;">${label}</p>
      ${content}
    </div>`;
}

function renderSection(section) {
  const type = section._type;

  if (type === 'openingNote') {
    return sectionWrapper(
      section.sectionTitle || 'Opening Note',
      blocksToHtml(section.body)
    );
  }

  if (type === 'essay') {
    return sectionWrapper(
      section.title || 'Essay',
      blocksToHtml(section.body)
    );
  }

  if (type === 'portfolioSpotlight') {
    return sectionWrapper(
      section.sectionTitle || 'Portfolio Spotlight',
      blocksToHtml(section.body)
    );
  }

  if (type === 'guestColumn') {
    const byline = [section.guestTitle, section.guestCompany].filter(Boolean).join(' · ');
    return sectionWrapper(
      section.sectionTitle || 'Guest Column',
      `<p style="margin:0 0 16px;font-weight:600;color:#1a1a1a;">${section.guestName || ''}${byline ? `<span style="font-weight:400;color:#6b7280;"> — ${byline}</span>` : ''}</p>
       ${blocksToHtml(section.body)}`
    );
  }

  if (type === 'radar') {
    const items = (section.items || []).map((item) =>
      `<div style="margin-bottom:18px;">
         <p style="margin:0 0 4px;font-weight:600;color:#1a1a1a;">${item.technology || ''}</p>
         <p style="margin:0;color:#555;line-height:1.6;">${item.oneLiner || ''}</p>
       </div>`
    ).join('');
    return sectionWrapper(section.sectionTitle || 'The Radar', items);
  }

  if (type === 'reading') {
    const items = (section.items || []).map((item) =>
      `<div style="margin-bottom:18px;">
         <p style="margin:0 0 4px;"><a href="${item.url || '#'}" style="font-weight:600;color:#1a1a1a;text-decoration:underline;" target="_blank">${item.title || ''}</a></p>
         ${item.blurb ? `<p style="margin:0;color:#555;line-height:1.6;">${item.blurb}</p>` : ''}
       </div>`
    ).join('');
    return sectionWrapper(section.sectionTitle || "What We're Reading", items);
  }

  if (type === 'freeform') {
    return sectionWrapper(section.title || 'Note', blocksToHtml(section.body));
  }

  return '';
}

// ─── Email template ───────────────────────────────────────────────────────────

function buildEmail(newsletter) {
  const { title, edition, shortDescription, sections = [], publishedDate } = newsletter;
  const dateStr = publishedDate
    ? new Date(publishedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const sectionsHtml = sections.map(renderSection).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:620px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">

    <!-- Header -->
    <div style="padding:32px 40px 24px;border-bottom:1px solid #e5e7eb;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;">YALI Capital · Tattva</p>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#1a1a1a;line-height:1.3;">${title}</h1>
      <p style="margin:0;font-size:13px;color:#9ca3af;">Edition #${edition || '?'}${dateStr ? ` · ${dateStr}` : ''}</p>
    </div>

    <!-- Beta badge -->
    <div style="padding:10px 40px;background:#fef3c7;border-bottom:1px solid #fde68a;">
      <p style="margin:0;font-size:12px;color:#92400e;">🧪 <strong>Beta send</strong> — you're receiving this as a beta tester before it goes to the full list.</p>
    </div>

    <!-- Short description -->
    ${shortDescription ? `<div style="padding:24px 40px 0;"><p style="margin:0;font-size:16px;line-height:1.7;color:#555;font-style:italic;">${shortDescription}</p></div>` : ''}

    <!-- Sections -->
    <div style="padding:0 40px 40px;">
      ${sectionsHtml}
    </div>

    <!-- Footer -->
    <div style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
        You're on this list as a beta tester for Tattva, YALI Capital's newsletter.<br>
        <a href="https://yali.vc" style="color:#6b7280;">yali.vc</a>
      </p>
    </div>

  </div>
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

    // Fetch newsletter from Sanity (draft or published)
    const newsletter = await client.fetch(
      `*[_type == "newsletter" && _id in [$id, "drafts." + $id]][0]{
        title, edition, shortDescription, publishedDate, status,
        sections[]{
          _type,
          sectionTitle, title,
          body, author->{name},
          company->{name},
          guestName, guestTitle, guestCompany,
          items[]{ technology, oneLiner, contributor->{name}, title, url, blurb }
        }
      }`,
      { id: newsletterId }
    );

    if (!newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }

    // Fetch beta subscribers
    const betaSubscribers = await client.fetch(
      `*[_type == "newsletterSubscriber" && beta == true]{email}`
    );

    if (!betaSubscribers.length) {
      return NextResponse.json({ error: 'No beta subscribers found' }, { status: 400 });
    }

    const emailHtml = buildEmail(newsletter);
    const subject = `[Beta] Tattva #${newsletter.edition || '?'} — ${newsletter.title}`;
    const toAddresses = betaSubscribers.map((s) => s.email);

    const { data, error } = await resend.emails.send({
      from: 'Tattva by YALI Capital <tattva@yali.vc>',
      to: toAddresses,
      subject,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      sent: toAddresses.length,
      recipients: toAddresses,
      resendId: data?.id,
    });
  } catch (err) {
    console.error('send-newsletter-beta error:', err);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
