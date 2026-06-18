import { z } from 'zod';
import { ACCESS_ACTIONS, COMPANY_ROLES } from '@/lib/dms';

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
  category: z.string().min(1, 'Category is required').max(60, 'Category is too long'),
  fileUrl: z.string().url('File URL is required'),
  fileKey: z.string().min(1, 'File key is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  size: z.number().int().positive('File size is required'),
  folderId: z.string().optional().nullable(),
  isSensitive: z.boolean().optional(),
  // Upload-time allow list: user ids who may always open/download this document,
  // regardless of how sensitive its folder is.
  allowedUserIds: z.array(z.string()).max(50).optional(),
});

export const trustedViewersSchema = z.object({
  viewerIds: z.array(z.string()).max(50),
});

export const accessResponseSchema = z.object({
  decision: z.enum(['APPROVE', 'DENY']),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(60, 'Category name is too long'),
});

export const documentAccessSchema = z.object({
  action: z.enum(ACCESS_ACTIONS as [string, ...string[]]),
});
