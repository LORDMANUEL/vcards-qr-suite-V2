export const SYSTEM_ROLES = ['ADMIN', 'IT', 'MARKETING', 'MARKETING_MANAGER', 'SAC', 'SALES_MANAGER', 'SUPER_ADMIN'] as const;

export function hasRole(role: string | undefined | null, allowed: readonly string[]) {
  return !!role && allowed.includes(role);
}

export function canManageCompanies(role: string | undefined | null) {
  return hasRole(role, ['ADMIN', 'IT', 'SUPER_ADMIN']);
}

export function canManageThemes(role: string | undefined | null) {
  return hasRole(role, ['ADMIN', 'IT', 'MARKETING', 'MARKETING_MANAGER', 'SUPER_ADMIN']);
}

export function canManageSystemUsers(role: string | undefined | null) {
  return hasRole(role, ['ADMIN', 'IT', 'SUPER_ADMIN']);
}

export function canViewVcards(role: string | undefined | null) {
  return hasRole(role, SYSTEM_ROLES);
}

export function canBulkImportVcards(role: string | undefined | null) {
  return hasRole(role, ['ADMIN', 'IT', 'MARKETING', 'MARKETING_MANAGER', 'SALES_MANAGER', 'SUPER_ADMIN']);
}
