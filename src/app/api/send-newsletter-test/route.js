import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { writeClient } from '@/lib/sanity';
import { NEWSLETTER_QUERY, buildEmail, getUnsubscribeUrl } from '@/lib/newsletter-email';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { newsletterId, email } = await request.json();

    if (!newsletterId || !email) {
      return NextResponse.json({ error: 'newsletterId and email required' }, { status: 400 });
    }
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const newsletter = await writeClient.fetch(NEWSLETTER_QUERY, { id: newsletterId }, { perspective: 'previewDrafts' });
    if (!newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }

    const unsubscribeUrl = getUnsubscribeUrl(email);
    const html = buildEmail(newsletter, unsubscribeUrl);
    const subject = `[TEST v${Date.now().toString().slice(-4)}] Tattva #${newsletter.edition || '?'}: ${newsletter.title}`;

    const { error } = await resend.emails.send({
      from: 'Yali Capital Newsletter <newsletter@yali.vc>',
      to: [email],
      subject,
      html,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
      },
    });

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, sent_to: email });
  } catch (err) {
    console.error('send-newsletter-test error:', err);
    return NextResponse.json({ error: err.message || 'Unexpected error' }, { status: 500 });
  }
}
