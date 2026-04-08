import { NextResponse } from 'next/server';
import { writeClient } from '@/lib/sanity';

export async function POST(request) {
  try {
    const { token } = await request.json();
    if (token) {
      const email = Buffer.from(token, 'base64').toString('utf-8');
      const subscriber = await writeClient.fetch(
        `*[_type == "newsletterSubscriber" && email == $email][0]{ _id }`,
        { email }
      );
      if (subscriber?._id) {
        await writeClient
          .patch(subscriber._id)
          .set({ unsubscribed: true, unsubscribedAt: new Date().toISOString() })
          .commit();
      }
    }
  } catch { /* swallow — always return 200 */ }
  return NextResponse.json({ ok: true });
}
