import { FolderDetailClient } from '@/components/folder-detail-client';

export default async function FolderDetailPage({
  params,
}: {
  params: Promise<{ folderId: string }>;
}) {
  const { folderId } = await params;

  return <FolderDetailClient folderId={folderId} />;
}
