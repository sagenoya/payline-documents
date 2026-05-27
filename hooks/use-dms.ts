'use client';

import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { $api } from '@/repository';
import type { CreateDocumentInput, CreateFolderInput } from '@/types/dms';

export const dmsKeys = {
  profile: ['dms', 'profile'] as const,
  folders: (parentId?: string | null) => ['dms', 'folders', parentId ?? 'root'] as const,
  folder: (folderId: string) => ['dms', 'folder', folderId] as const,
  documents: (query?: Record<string, unknown>) => ['dms', 'documents', query ?? {}] as const,
  activity: ['dms', 'activity'] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: dmsKeys.profile,
    queryFn: async () => (await $api.dms.getProfile()).data,
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
  recent?: boolean;
  take?: number;
}, options?: { enabled?: boolean }) {
  return useInfiniteQuery({
    queryKey: dmsKeys.documents(query),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => (await $api.dms.getDocuments({ ...query, page: pageParam })).data,
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined),
    enabled: options?.enabled ?? true,
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
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => $api.dms.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dms', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'folders'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'folder'] });
      queryClient.invalidateQueries({ queryKey: ['dms', 'activity'] });
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
