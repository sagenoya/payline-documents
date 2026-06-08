import { z } from 'zod';
import { ACCESS_ACTIONS, COMPANY_ROLES, DOCUMENT_CATEGORIES } from '@/lib/dms';

export const onboardingSchema = z.object({
  companyRole: z.enum(COMPANY_ROLES as [string, ...string[]]),
});

export const folderCreateSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(80, 'Folder name is too long'),
  parentId: z.string().optional().nullable(),
});

export const documentCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(160, 'Title is too long'),
  description: z.string().max(500, 'Description is too long').optional().nullable(),
  category: z.enum(DOCUMENT_CATEGORIES as [string, ...string[]]),
  fileUrl: z.string().url('File URL is required'),
  fileKey: z.string().min(1, 'File key is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  size: z.number().int().positive('File size is required'),
  folderId: z.string().optional().nullable(),
  isSensitive: z.boolean().optional(),
});

export const trustedViewersSchema = z.object({
  viewerIds: z.array(z.string()).max(50),
});

export const accessResponseSchema = z.object({
  decision: z.enum(['APPROVE', 'DENY']),
});

export const documentAccessSchema = z.object({
  action: z.enum(ACCESS_ACTIONS as [string, ...string[]]),
});
