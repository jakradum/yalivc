// GET /dataroom/file/<assetId> — a data room PDF from the Supabase twin.
// Needs a data room session and data room access; the asset must be a
// data-room dataRoomDocument file, a dataroomFundContent file, or the
// generatedPdf of the latest published lpQuarterlyReport. Otherwise 404.
// Success: 302 to a 10-minute signed URL. `?dl=<name>` downloads under that name.
import { handleFileRequest } from '@/lib/supabase/files';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { assetId } = await params;
  return handleFileRequest(request, assetId, 'dataroom');
}
