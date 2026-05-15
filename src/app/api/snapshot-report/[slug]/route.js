import { handleSnapshotPost } from '@/lib/snapshotRequestHandler';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request, { params }) {
  const { slug } = await params;
  return handleSnapshotPost(slug);
}
