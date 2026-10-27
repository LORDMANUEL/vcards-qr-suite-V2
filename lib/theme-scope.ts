/** Publication decisions shared by the scoped-theme API and its tests. */
export type VCardThemeScope = 'company' | 'branch';
export function isVCardThemeScope(value: unknown): value is VCardThemeScope {
  return value === 'company' || value === 'branch';
}
export function themeSlot(type: string | null | undefined): 'seasonal' | 'corporate' {
  return type === 'SEASONAL' || type === 'FESTIVE' ? 'seasonal' : 'corporate';
}
export function isSameCompanyScope(themeCompanyId: string | null, targetCompanyId: string): boolean {
  return themeCompanyId === null || themeCompanyId === targetCompanyId;
}
