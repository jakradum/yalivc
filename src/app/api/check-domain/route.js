import { NextResponse } from 'next/server';
import { getSharedCodeDomain } from '@/lib/lp-data';


export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain')?.toLowerCase().trim();

  if (!domain) {
    return NextResponse.json({ shared: false });
  }

  const result = await getSharedCodeDomain(domain);

  return NextResponse.json({ shared: !!result });
}
