'use client';

import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { $api } from '@/repository';
import type {
  ActivityFilter,
  CreateDocumentInput,
  CreateFolderInput,
  DocumentSortBy,
  SortDirection,
  UpdateFolderInput,
} from '@/types/dms';

export const dmsKeys = {
  profile: ['dms', 'profile'] as const,
  dashboard: ['dms', 'dashboard'] as const,
  users: ['dms', 'users'] as const,
  folders: (parentId?: string | null) => ['dms', 'folders', parentId ?? 'root'] as const,
  folder: (folderId: string) => ['dms', 'folder', folderId] as const,
  documents: (query?: Record<string, unknown>) => ['dms', 'documents', query ?? {}] as const,
  activity: ['dms', 'activity'] as const,
  trustedViewers: ['dms', 'trustedViewers'] as const,
  notifications: ['dms', 'notifications'] as const,
  notificationCount: ['dms', 'notificationCount'] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: dmsKeys.dashboard,
    queryFn: async () => (await $api.dms.getDashboard()).data,
  });
}

export function useProfile() {
  return useQuery({
    queryKey: dmsKeys.profile,
    queryFn: async () => (await $api.dms.getProfile()).data,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: dmsKeys.users,
    queryFn: async () => (await $api.dms.getUsers()).data,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companyRole: string) => $api.dms.updateProfile(companyRole),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dmsKeys.profile }),
  });
}

export function useFolders(parentId?: string | null, options?: { enabled?: boolean }) {
  return useInfiniteQuery({
    queryKey: dmsKeys.folders(parentId),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => (await $api.dms.getFolders(parentId, pageParam)).data,
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined),
    enabled: options?.enabled ?? true,
  });
}

export function useFoldersPage(parentId?: string | null, page = 1, take = 15, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...dmsKeys.folders(parentId), page, take],
    queryFn: async () => (await $api.dms.getFolders(parentId, page, take)).data,
    enabled: options?.enabled ?? true,
    placeholderData: (previousData) => previousData,
  });
}

export function useAllFolders(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['dms', 'folders', 'all'],
    queryFn: async () => (await $api.dms.getAllFolders()).data,
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateFolder(parentId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFolderInput) => $api.dms.createFolder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dms', 'folders'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'folder'] });
    },
  });
}

export function useFolder(folderId: string) {
  return useQuery({
    queryKey: dmsKeys.folder(folderId),
    queryFn: async () => (await $api.dms.getFolder(folderId)).data,
  });
}

export function useDocuments(query?: {
  search?: string;
  category?: string;
  folderId?: string;
  uploadedById?: string;
  recent?: boolean;
  take?: number;
  sortBy?: DocumentSortBy;
  sortDirection?: SortDirection;
}, options?: { enabled?: boolean }) {
  return useInfiniteQuery({
    queryKey: dmsKeys.documents(query),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => (await $api.dms.getDocuments({ ...query, page: pageParam })).data,
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined),
    enabled: options?.enabled ?? true,
  });
}

export function useDocumentsPage(query?: {
  search?: string;
  category?: string;
  folderId?: string;
  uploadedById?: string;
  recent?: boolean;
  take?: number;
  page?: number;
  sortBy?: DocumentSortBy;
  sortDirection?: SortDirection;
}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: dmsKeys.documents(query),
    queryFn: async () => (await $api.dms.getDocuments(query)).data,
    enabled: options?.enabled ?? true,
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDocumentInput) => $api.dms.createDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dms', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'folders'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'folder'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'activity'] });
      queryClient.invalidateQueries({ queryKey: dmsKeys.dashboard });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDocumentInput> }) =>
      $api.dms.updateDocument(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dms', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'folders'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'folder'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'activity'] });
      queryClient.invalidateQueries({ queryKey: dmsKeys.dashboard });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => $api.dms.deleteDocument(documentId),
    onMutate: async (documentId) => {
      await queryClient.cancelQueries({ queryKey: ['dms', 'documents'] });
      const previousDocuments = queryClient.getQueriesData({ queryKey: ['dms', 'documents'] });

      queryClient.setQueriesData({ queryKey: ['dms', 'documents'] }, (oldData: any) => {
        if (!oldData) return oldData;

        if (Array.isArray(oldData.pages)) {
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              data: page.data.filter((document: any) => document.id !== documentId),
              meta: {
                ...page.meta,
                total: Math.max(0, page.meta.total - 1),
              },
            })),
          };
        }

        if (Array.isArray(oldData.data)) {
          return {
            ...oldData,
            data: oldData.data.filter((document: any) => document.id !== documentId),
            meta: {
              ...oldData.meta,
              total: Math.max(0, oldData.meta.total - 1),
            },
          };
        }

        return oldData;
      });

      return { previousDocuments };
    },
    onError: (_error, _documentId, context) => {
      context?.previousDocuments.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dms', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'folders'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'folder'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'activity'] });
      queryClient.invalidateQueries({ queryKey: dmsKeys.dashboard });
    },
  });
}

export function useRestoreDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => $api.dms.restoreDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dms', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'folders'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'folder'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'activity'] });
      queryClient.invalidateQueries({ queryKey: dmsKeys.dashboard });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (folderId: string) => $api.dms.deleteFolder(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dms', 'folders'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'folder'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'activity'] });
      queryClient.invalidateQueries({ queryKey: dmsKeys.dashboard });
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFolderInput }) =>
      $api.dms.updateFolder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dms', 'folders'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'folder'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'activity'] });
    },
  });
}

export function useLogDocumentAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, action }: { documentId: string; action: 'VIEW' | 'DOWNLOAD' }) =>
      $api.dms.logDocumentAccess(documentId, action),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dmsKeys.activity }),
  });
}

export function useActivity(take = 15) {
  return useInfiniteQuery({
    queryKey: [...dmsKeys.activity, take],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => (await $api.dms.getActivity(take, pageParam)).data,
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined),
  });
}

export function useActivityPage(take = 15, page = 1, filter: ActivityFilter = 'all') {
  return useQuery({
    queryKey: [...dmsKeys.activity, take, page, filter],
    queryFn: async () => (await $api.dms.getActivity(take, page, filter)).data,
    placeholderData: (previousData) => previousData,
  });
}

export function useDocumentVersions(documentId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['dms', 'documentVersions', documentId],
    queryFn: async () => (await $api.dms.getDocumentVersions(documentId)).data,
    enabled: options?.enabled ?? true,
  });
}

export function useBulkDeleteDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentIds: string[]) => $api.dms.bulkDeleteDocuments(documentIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dms', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'folders'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'folder'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'activity'] });
      queryClient.invalidateQueries({ queryKey: dmsKeys.dashboard });
    },
  });
}

export function useBulkMoveDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentIds, folderId }: { documentIds: string[]; folderId: string | null }) =>
      $api.dms.bulkMoveDocuments(documentIds, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dms', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'folders'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'folder'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'activity'] });
      queryClient.invalidateQueries({ queryKey: dmsKeys.dashboard });
    },
  });
}

export function useRequestDocumentAccess() {
  return useMutation({
    mutationFn: (documentId: string) => $api.dms.requestDocumentAccess(documentId),
  });
}

export function useRequestFolderAccess() {
  return useMutation({
    mutationFn: (folderId: string) => $api.dms.requestFolderAccess(folderId),
  });
}

export function useSetFolderSensitive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isSensitive }: { id: string; isSensitive: boolean }) =>
      $api.dms.setFolderSensitive(id, isSensitive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dms', 'folders'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'folder'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'documents'] });
    },
  });
}

export function useTrustedViewers() {
  return useQuery({
    queryKey: dmsKeys.trustedViewers,
    queryFn: async () => (await $api.dms.getTrustedViewers()).data,
    staleTime: 60 * 1000,
  });
}

export function useSaveTrustedViewers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (viewerIds: string[]) => $api.dms.saveTrustedViewers(viewerIds),
    onSuccess: (response) => {
      queryClient.setQueryData(dmsKeys.trustedViewers, response.data);
      queryClient.invalidateQueries({ queryKey: ['dms', 'documents'] });
    },
  });
}

// Cheap, frequently-polled unread badge. Paused automatically when the tab is
// not focused (refetchIntervalInBackground defaults to false).
export function useNotificationCount() {
  return useQuery({
    queryKey: dmsKeys.notificationCount,
    queryFn: async () => (await $api.dms.getNotificationCount()).data,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

// Full notification payload — only fetched on demand (when the bell is opened).
export function useNotifications(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: dmsKeys.notifications,
    queryFn: async () => (await $api.dms.getNotifications()).data,
    enabled: options?.enabled ?? true,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => $api.dms.markNotificationsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: dmsKeys.notifications });
      const previous = queryClient.getQueryData(dmsKeys.notifications);
      queryClient.setQueryData(dmsKeys.notifications, (old: any) =>
        old
          ? {
              ...old,
              unreadCount: 0,
              notifications: old.notifications.map((n: any) => ({ ...n, read: true })),
            }
          : old,
      );
      queryClient.setQueryData(dmsKeys.notificationCount, { unreadCount: 0 });
      return { previous };
    },
    onError: (_e, _v, context) => {
      if (context?.previous) queryClient.setQueryData(dmsKeys.notifications, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dmsKeys.notifications });
      queryClient.invalidateQueries({ queryKey: dmsKeys.notificationCount });
    },
  });
}

export function useRespondToAccessRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'APPROVE' | 'DENY' }) =>
      $api.dms.respondToAccessRequest(id, decision),
    onMutate: async ({ id, decision }) => {
      await queryClient.cancelQueries({ queryKey: dmsKeys.notifications });
      const previous = queryClient.getQueryData(dmsKeys.notifications);
      queryClient.setQueryData(dmsKeys.notifications, (old: any) =>
        old
          ? {
              ...old,
              notifications: old.notifications.map((n: any) =>
                n.accessRequest?.id === id
                  ? { ...n, read: true, accessRequest: { ...n.accessRequest, status: decision === 'APPROVE' ? 'APPROVED' : 'DENIED' } }
                  : n,
              ),
            }
          : old,
      );
      return { previous };
    },
    onError: (_e, _v, context) => {
      if (context?.previous) queryClient.setQueryData(dmsKeys.notifications, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dmsKeys.notifications });
      queryClient.invalidateQueries({ queryKey: dmsKeys.notificationCount });
      queryClient.invalidateQueries({ queryKey: ['dms', 'documents'] });
    },
  });
}
