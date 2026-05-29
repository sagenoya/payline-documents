import { API_URLS } from '@/data/api-url';
import type { ApiResponse } from '@/types/api';
import type {
  CreateDocumentInput,
  CreateFolderInput,
  CurrentProfile,
  ActivityLogType,
  ActivityFilter,
  DashboardData,
  DocumentSummary,
  DocumentSortBy,
  FolderDetail,
  FolderSummary,
  Paginated,
  SortDirection,
  UserOption,
} from '@/types/dms';
import { FetchFactory } from '../factory';

export class DmsModule extends FetchFactory {
  getProfile(): Promise<ApiResponse<CurrentProfile>> {
    return this.call('GET', API_URLS.dms.profile);
  }

  getDashboard(): Promise<ApiResponse<DashboardData>> {
    return this.call('GET', API_URLS.dms.dashboard);
  }

  getUsers(): Promise<ApiResponse<UserOption[]>> {
    return this.call('GET', API_URLS.dms.users);
  }

  updateProfile(companyRole: string): Promise<ApiResponse<CurrentProfile>> {
    return this.call('PATCH', API_URLS.dms.profile, { body: { companyRole } });
  }

  getFolders(parentId?: string | null, page = 1, take = 15): Promise<ApiResponse<Paginated<FolderSummary>>> {
    return this.call('GET', API_URLS.dms.folders, {
      query: { ...(parentId ? { parentId } : {}), page, take },
    });
  }

  getAllFolders(): Promise<ApiResponse<Pick<FolderSummary, 'id' | 'name' | 'parentId'>[]>> {
    return this.call('GET', API_URLS.dms.folders, {
      query: { all: 'true' },
    });
  }

  createFolder(data: CreateFolderInput): Promise<ApiResponse<FolderSummary>> {
    return this.call('POST', API_URLS.dms.folders, { body: data });
  }

  getFolder(folderId: string): Promise<ApiResponse<FolderDetail>> {
    return this.call('GET', API_URLS.dms.folder(folderId));
  }

  getDocuments(query?: {
    search?: string;
    category?: string;
    folderId?: string;
    uploadedById?: string;
    recent?: boolean;
    take?: number;
    page?: number;
    sortBy?: DocumentSortBy;
    sortDirection?: SortDirection;
  }): Promise<ApiResponse<Paginated<DocumentSummary>>> {
    return this.call('GET', API_URLS.dms.documents, { query });
  }

  createDocument(data: CreateDocumentInput): Promise<ApiResponse<DocumentSummary>> {
    return this.call('POST', API_URLS.dms.documents, { body: data });
  }

  updateDocument(
    documentId: string,
    data: Partial<CreateDocumentInput>,
  ): Promise<ApiResponse<DocumentSummary>> {
    return this.call('PATCH', API_URLS.dms.document(documentId), { body: data });
  }

  getDocument(documentId: string): Promise<ApiResponse<DocumentSummary>> {
    return this.call('GET', API_URLS.dms.document(documentId));
  }

  deleteDocument(documentId: string): Promise<ApiResponse<{ id: string }>> {
    return this.call('DELETE', API_URLS.dms.document(documentId));
  }

  restoreDocument(documentId: string): Promise<ApiResponse<DocumentSummary>> {
    return this.call('POST', API_URLS.dms.documentRestore(documentId));
  }

  deleteFolder(folderId: string): Promise<ApiResponse<{ id: string }>> {
    return this.call('DELETE', API_URLS.dms.folder(folderId));
  }

  updateFolder(
    folderId: string,
    data: { parentId?: string | null },
  ): Promise<ApiResponse<FolderSummary>> {
    return this.call('PATCH', API_URLS.dms.folder(folderId), { body: data });
  }

  logDocumentAccess(
    documentId: string,
    action: 'VIEW' | 'DOWNLOAD',
  ): Promise<ApiResponse<ActivityLogType>> {
    return this.call('POST', API_URLS.dms.documentAccess(documentId), {
      body: { action },
    });
  }

  getActivity(take = 15, page = 1, filter: ActivityFilter = 'all'): Promise<ApiResponse<Paginated<ActivityLogType>>> {
    return this.call('GET', API_URLS.dms.activity, { query: { take, page, filter } });
  }
}
