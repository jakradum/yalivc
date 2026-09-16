import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { writeClient } from '@/lib/sanity';
import { getUnsubscribeUrl } from '@/lib/newsletter-email';
import { buildWelcomeEmail } from '@/lib/welcome-email';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!process.env.SANITY_API_TOKEN) {
      console.error('SANITY_API_TOKEN not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    await writeClient.create({
      _type: 'newsletterSubscriber',
      email: normalizedEmail,
      subscribedAt: new Date().toISOString(),
      source: 'homepage-footer',
    });

    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const unsubscribeUrl = getUnsubscribeUrl(normalizedEmail);
        await resend.emails.send({
          from: 'Yali Capital Newsletter <newsletter@yali.vc>',
          to: [normalizedEmail],
          subject: "You're subscribed to Tattva",
          html: buildWelcomeEmail(unsubscribeUrl),
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        });
      } catch (emailError) {
        console.error('Welcome email failed to send:', emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
