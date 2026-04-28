import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import crypto from 'crypto';

const SANITY_WRITE_TOKEN = process.env.SANITY_WRITE_TOKEN;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://yali.vc',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request) {
  if (!SANITY_WRITE_TOKEN) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: CORS_HEADERS });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS_HEADERS });
  }

  const { docId } = body ?? {};
  if (!docId || typeof docId !== 'string') {
    return NextResponse.json({ error: 'docId is required' }, { status: 400, headers: CORS_HEADERS });
  }

  const code = crypto.randomInt(100000, 999999).toString();
  // 6 months from now
  const expiry = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString();

  const writeClient = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nt0wmty3',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    token: SANITY_WRITE_TOKEN,
  });

  // Strip drafts. prefix — always write to the published document.
  // createIfNotExists ensures it works even if the doc hasn't been published yet.
  const cleanId = docId.replace(/^drafts\./, '');

  try {
    await writeClient
      .transaction()
      .createIfNotExists({ _id: cleanId, _type: 'domainPrivilege' })
      .patch(cleanId, p => p.set({ inviteCode: code, codeExpiry: expiry, usedCount: 0 }))
      .commit();
  } catch (err) {
    console.error('Failed to write domain privilege code:', err);
    return NextResponse.json({ error: 'Failed to save code' }, { status: 500, headers: CORS_HEADERS });
  }

  return NextResponse.json({ code, expiry }, { headers: CORS_HEADERS });
}
