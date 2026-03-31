// GET /partners/api/generate-pdf/[slug]
// Used in local development where the portal lives under /partners/
import { handlePdfGet } from '@/lib/pdfRequestHandler';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request, { params }) {
  const { slug } = await params;
  return handlePdfGet(slug);
}
