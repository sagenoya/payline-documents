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
    folders: '/api/folders',
    folder: (folderId: string) => `/api/folders/${folderId}`,
    documents: '/api/documents',
    document: (documentId: string) => `/api/documents/${documentId}`,
    documentRestore: (documentId: string) => `/api/documents/${documentId}/restore`,
    documentAccess: (documentId: string) => `/api/documents/${documentId}/access`,
    activity: '/api/activity',
    uploadthing: '/api/uploadthing',
  },
} as const;
