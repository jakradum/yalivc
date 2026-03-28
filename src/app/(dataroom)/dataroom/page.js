import { getDataRoomDocuments } from '@/lib/sanity-queries';
import DataroomClient from './DataroomClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DataroomPage() {
  const documents = await getDataRoomDocuments();

  return <DataroomClient documents={documents || []} />;
}
