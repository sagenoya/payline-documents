import type { ActivityAction } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type ActivityInput = {
  userId: string;
  action: ActivityAction;
  documentId?: string | null;
  folderId?: string | null;
  targetName?: string | null;
  targetType?: string | null;
};

export async function logActivity(input: ActivityInput) {
  try {
    await prisma.activityLog.create({
      data: input,
    });
  } catch (error) {
    console.error('Activity log failed', error);
  }
}
