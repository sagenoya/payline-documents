import type { CompanyRole, ActivityAction, DocumentCategory } from '@prisma/client';

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'HR',
  'FINANCE',
  'LEGAL',
  'OPERATIONS',
  'ENGINEERING',
];

export const COMPANY_ROLES: CompanyRole[] = [
  'FRONTEND_DEVELOPER',
  'BACKEND_DEVELOPER',
  'PRODUCT',
  'LEGAL_HEAD',
  'CEO',
  'COMPLIANCE',
  'TRADING_LEAD',
  'ACCOUNTANT',
];

export const UPLOAD_ALLOWED_ROLES = new Set<CompanyRole>([
  'FRONTEND_DEVELOPER',
  'BACKEND_DEVELOPER',
  'PRODUCT',
  'LEGAL_HEAD',
]);

export const ACCESS_ACTIONS: ActivityAction[] = [
  'VIEW',
  'DOWNLOAD',
  'CREATE_DOC',
  'EDIT_DOC',
  'MOVE_DOC',
  'DELETE_DOC',
  'CREATE_FOLDER',
  'MOVE_FOLDER',
  'DELETE_FOLDER',
];

export const roleLabels: Record<CompanyRole, string> = {
  FRONTEND_DEVELOPER: 'Frontend Developer',
  BACKEND_DEVELOPER: 'Backend Developer',
  PRODUCT: 'Product',
  LEGAL_HEAD: 'Legal Head',
  CEO: 'CEO',
  COMPLIANCE: 'Compliance',
  TRADING_LEAD: 'Trading Lead',
  ACCOUNTANT: 'Accountant',
};

export const categoryLabels: Record<DocumentCategory, string> = {
  HR: 'HR',
  FINANCE: 'Finance',
  LEGAL: 'Legal',
  OPERATIONS: 'Operations',
  ENGINEERING: 'Engineering',
};

export function canUpload(role?: CompanyRole | null) {
  return Boolean(role && UPLOAD_ALLOWED_ROLES.has(role));
}

export function canDeleteDocument(params: {
  userId: string;
  uploadedById: string;
  role?: CompanyRole | null;
}) {
  return params.userId === params.uploadedById || params.role === 'FRONTEND_DEVELOPER';
}

export function canDeleteFolder(role?: CompanyRole | null) {
  return role === 'FRONTEND_DEVELOPER';
}
