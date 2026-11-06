// GET /partners/file/<assetId> — an LP portal PDF from the Supabase twin.
// Needs a portal session; the asset must belong to an lpQuarterlyReport the user
// may see (GIFT City financials: GIFT City LPs and staff only). Otherwise 404.
// Success: 302 to a 10-minute signed URL. `?dl=<name>` downloads under that name.
import { handleFileRequest } from '@/lib/supabase/files';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { assetId } = await params;
  return handleFileRequest(request, assetId, 'portal');
}
