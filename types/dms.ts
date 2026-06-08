import type { CompanyRole, ActivityAction, DocumentCategory } from '@prisma/client';

type DateLike = string | Date;

export type BasicUser = {
  id: string;
  email: string;
  name: string;
  imageUrl?: string | null;
};

export type UserOption = Pick<BasicUser, 'id' | 'name' | 'email' | 'imageUrl'>;

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
  canViewActivity: boolean;
  isAdmin: boolean;
  onboarded: boolean;
};

export type LockMeta = {
  locked?: boolean;
  lockKind?: 'DOCUMENT' | 'FOLDER';
  lockTargetId?: string;
  lockTargetName?: string;
  lockOwnerName?: string | null;
};

export type FolderSummary = LockMeta & {
  id: string;
  name: string;
  parentId?: string | null;
  isSensitive?: boolean;
  createdById?: string | null;
  createdAt: DateLike;
  updatedAt: DateLike;
  _count?: {
    children: number;
    documents: number;
  };
};

export type DocumentSummary = LockMeta & {
  id: string;
  title: string;
  description?: string | null;
  category: DocumentCategory;
  isSensitive: boolean;
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
  isSensitive?: boolean;
};

export type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'DENIED';

export type NotificationType = 'ACCESS_REQUEST' | 'ACCESS_GRANTED' | 'ACCESS_DENIED';

export type NotificationItem = {
  id: string;
  type: NotificationType;
  read: boolean;
  accessRequestId?: string | null;
  createdAt: DateLike;
  accessRequest?: {
    id: string;
    status: AccessRequestStatus;
    expiresAt?: DateLike | null;
    requester: BasicUser;
    document?: Pick<DocumentSummary, 'id' | 'title'> | null;
    folder?: Pick<FolderSummary, 'id' | 'name'> | null;
  } | null;
};

export type NotificationsResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
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

export type DocumentSortBy = 'title' | 'createdAt' | 'updatedAt' | 'size';

export type SortDirection = 'asc' | 'desc';

export type ActivityFilter = 'all' | 'views' | 'downloads' | 'uploads' | 'deletes';

export type DashboardData = {
  documentCount: number;
  folderCount: number;
  userCount: number;
  canUpload: boolean;
  isUnavailable: boolean;
};
