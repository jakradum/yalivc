// GET /partners/api/generate-pdf/[slug]
// Used in local development where the portal lives under /partners/
import { handlePdfGet } from '@/lib/pdfRequestHandler';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request, { params }) {
  const { slug } = await params;
  const url = new URL(request.url);
  const returnHtml = url.searchParams.get('html') === '1';
  const debugMode = url.searchParams.get('debug') === '1';
  return handlePdfGet(slug, { returnHtml, debugMode });
}
