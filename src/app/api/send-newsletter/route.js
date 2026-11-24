import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { writeClient } from '@/lib/sanity';
import { NEWSLETTER_QUERY, batchSend } from '@/lib/newsletter-email';
import { recipients } from '@/lib/newsletter-subscribers';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { newsletterId } = await request.json();

    if (!newsletterId) {
      return NextResponse.json({ error: 'newsletterId is required' }, { status: 400 });
    }
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const newsletter = await writeClient.fetch(NEWSLETTER_QUERY, { id: newsletterId }, { perspective: 'previewDrafts' });
    if (!newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }

    // Subscribers live in Supabase; the newsletter itself is still a Sanity document.
    const subscribers = await recipients();
    if (!subscribers.length) {
      return NextResponse.json({ error: 'No subscribers found' }, { status: 400 });
    }

    const sent = await batchSend(resend, newsletter, subscribers);
    // Counts only: subscriber addresses never go back to the browser.
    return NextResponse.json({ success: true, sent });
  } catch (err) {
    console.error('send-newsletter error:', err);
    return NextResponse.json({ error: err.message || 'Unexpected error' }, { status: 500 });
  }
}
