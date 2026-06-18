/**
 * Centralized API Base URL.
 * In production, this should be driven by environment variables.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

export const API_URLS = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    verifyEmail: `${API_BASE_URL}/auth/verify-email`,
  },
  user: {
    me: '/api/profile',
    profile: '/api/profile',
    updateAvatar: `${API_BASE_URL}/users/avatar`,
  },
  dms: {
    profile: '/api/profile',
    dashboard: '/api/dashboard',
    users: '/api/users',
    categories: '/api/categories',
    category: (id: string) => `/api/categories/${id}`,
    folders: '/api/folders',
    folder: (folderId: string) => `/api/folders/${folderId}`,
    documents: '/api/documents',
    document: (documentId: string) => `/api/documents/${documentId}`,
    documentRestore: (documentId: string) => `/api/documents/${documentId}/restore`,
    documentAccess: (documentId: string) => `/api/documents/${documentId}/access`,
    documentAccessList: (documentId: string) => `/api/documents/${documentId}/access-list`,
    documentVersions: (documentId: string) => `/api/documents/${documentId}/versions`,
    bulkDelete: '/api/documents/bulk/delete',
    bulkMove: '/api/documents/bulk/move',
    activity: '/api/activity',
    uploadthing: '/api/uploadthing',
    documentAccessRequest: (documentId: string) => `/api/documents/${documentId}/access-request`,
    folderAccessRequest: (folderId: string) => `/api/folders/${folderId}/access-request`,
    trustedViewers: '/api/settings/trusted-viewers',
    notifications: '/api/notifications',
    notificationsCount: '/api/notifications/count',
    accessRequestRespond: (id: string) => `/api/access-requests/${id}/respond`,
  },
} as const;
