import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { writeClient } from '@/lib/sanity';

const resend = new Resend(process.env.RESEND_API_KEY);

const INQUIRY_LABELS = {
  press: 'Press / media inquiry',
  partnership: 'Partnership',
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, inquiry, message, _hp } = body;

    // Honeypot — bots fill this, humans don't
    if (_hp) {
      return NextResponse.json({ success: true });
    }

    if (!name?.trim() || !email?.trim() || !inquiry || !message?.trim()) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    if (!INQUIRY_LABELS[inquiry]) {
      return NextResponse.json({ error: 'Invalid inquiry type.' }, { status: 400 });
    }

    const submittedAt = new Date().toISOString();

    // Write to Sanity
    await writeClient.create({
      _type: 'contactSubmission',
      name: name.trim(),
      email: email.trim().toLowerCase(),
      inquiryType: inquiry,
      message: message.trim(),
      submittedAt,
      status: 'new',
    });

    // Email notification
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'Yali Capital Contact Form <noreply@yali.vc>',
        to: 'press@yali.vc',
        replyTo: email.trim(),
        subject: `[${INQUIRY_LABELS[inquiry]}] from ${name.trim()}`,
        html: `
          <p><strong>Name:</strong> ${name.trim()}</p>
          <p><strong>Email:</strong> <a href="mailto:${email.trim()}">${email.trim()}</a></p>
          <p><strong>Inquiry type:</strong> ${INQUIRY_LABELS[inquiry]}</p>
          <hr />
          <p style="white-space:pre-wrap">${message.trim()}</p>
          <hr />
          <p style="color:#888;font-size:12px">Saved to Sanity Studio → Contact Submissions</p>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('contact-form error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
