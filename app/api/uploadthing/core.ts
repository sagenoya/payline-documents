import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';
import { canUpload } from '@/lib/dms';
import { requireClerkUser } from '@/server/auth';

const upload = createUploadthing();

export const ourFileRouter = {
  documentUploader: upload({
    pdf: { maxFileSize: '16MB', maxFileCount: 6 },
    image: { maxFileSize: '8MB', maxFileCount: 6 },
    text: { maxFileSize: '4MB', maxFileCount: 6 },
    blob: { maxFileSize: '32MB', maxFileCount: 6 },
  })
    .middleware(async () => {
      const user = await requireClerkUser();

      if (!canUpload(user.profile?.companyRole)) {
        throw new UploadThingError('You do not have upload access for company documents.');
      }

      return { userId: user.id };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      return {
        uploadedById: metadata.userId,
        fileUrl: file.ufsUrl,
        fileKey: file.key,
        fileName: file.name,
        fileSize: file.size,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
