import { NextResponse } from 'next/server';
import { unsubscribe } from '@/lib/newsletter-subscribers';

export async function POST(request) {
  try {
    const { token } = await request.json();
    if (token) {
      const email = Buffer.from(token, 'base64').toString('utf-8');
      await unsubscribe(email);
    }
  } catch { /* swallow — always return 200 */ }
  return NextResponse.json({ ok: true });
}
