// GET /api/generate-pdf/[slug]
// Used on the partners subdomain (middleware skips /api paths; no rewrite needed)
import { handlePdfGet } from '@/lib/pdfRequestHandler';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request, { params }) {
  const { slug } = await params;
  return handlePdfGet(slug);
}
