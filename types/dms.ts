import type { CompanyRole, ActivityAction, DocumentCategory } from '@prisma/client';

type DateLike = string | Date;

export type BasicUser = {
  id: string;
  email: string;
  name: string;
  imageUrl?: string | null;
};

export type Profile = {
  id: string;
  userId: string;
  companyRole: CompanyRole;
  onboardedAt: string;
  createdAt: DateLike;
  updatedAt: DateLike;
};

export type CurrentProfile = BasicUser & {
  profile?: Profile | null;
  canUpload: boolean;
};

export type FolderSummary = {
  id: string;
  name: string;
  parentId?: string | null;
  createdAt: DateLike;
  updatedAt: DateLike;
  _count?: {
    children: number;
    documents: number;
  };
};

export type DocumentSummary = {
  id: string;
  title: string;
  description?: string | null;
  category: DocumentCategory;
  fileUrl: string;
  fileKey: string;
  mimeType: string;
  size: number;
  uploadedById: string;
  uploadedBy: BasicUser;
  folderId?: string | null;
  folder?: Pick<FolderSummary, 'id' | 'name'> | null;
  lastAccessedAt?: DateLike | null;
  createdAt: DateLike;
  updatedAt: DateLike;
};

export type FolderDetail = FolderSummary & {
  children: FolderSummary[];
  documents: DocumentSummary[];
  breadcrumbs: Pick<FolderSummary, 'id' | 'name'>[];
};

export type ActivityLogType = {
  id: string;
  userId: string;
  documentId?: string | null;
  folderId?: string | null;
  action: ActivityAction;
  targetName?: string | null;
  targetType?: string | null;
  user: BasicUser;
  document?: Pick<DocumentSummary, 'id' | 'title' | 'category' | 'fileUrl' | 'mimeType'> | null;
  folder?: Pick<FolderSummary, 'id' | 'name'> | null;
  timestamp: DateLike;
};

export type CreateDocumentInput = {
  title: string;
  description?: string | null;
  category: DocumentCategory;
  fileUrl: string;
  fileKey: string;
  mimeType: string;
  size: number;
  folderId?: string | null;
};

export type CreateFolderInput = {
  name: string;
  parentId?: string | null;
};

export type UpdateFolderInput = {
  parentId?: string | null;
};

export type Paginated<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
};
