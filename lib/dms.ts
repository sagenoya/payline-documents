import type { CompanyRole, ActivityAction } from '@prisma/client';

// Seed catalog used the first time categories are listed. Categories are now a
// user-managed table (full CRUD), not a fixed enum.
export const DEFAULT_CATEGORIES: string[] = [
  'HR',
  'Finance',
  'Legal',
  'Operations',
  'Engineering',
];

// Department tree auto-seeded as real folders on first load: each department is
// a top-level folder, and each one holds the same three brand sub-folders. The
// documents inside each brand folder stay unique.
export const DEPARTMENTS: string[] = [
  'Frontend',
  'Backend',
  'Compliance',
  'Legal',
  'Product',
  'Finance',
  'Trading',
];

export const DEPARTMENT_BRANDS: string[] = ['CURRENPAY', 'PAYLINE', 'WINGTIP'];

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
  'PRODUCT',
  'LEGAL_HEAD',
  'COMPLIANCE'
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

export function canUpload(_role?: CompanyRole | null) {
  // Every onboarded user can upload documents and create folders.
  return true;
}

export function canDeleteFolder(role?: CompanyRole | null) {
  return role === 'FRONTEND_DEVELOPER';
}
