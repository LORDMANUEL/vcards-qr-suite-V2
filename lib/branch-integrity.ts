/** Pure guards used by company/branch API writes. */
export function getRequestedCompanyId(body: Record<string, unknown>): string | undefined {
  if (!Object.prototype.hasOwnProperty.call(body, 'companyId')) return undefined;
  const value = body.companyId;
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('companyId must be a non-empty string when supplied');
  }
  return value.trim();
}

export function branchBelongsToCompany(
  branch: { companyId?: string | null },
  companyId: unknown,
): boolean {
  return typeof companyId === 'string' && companyId.length > 0 && branch.companyId === companyId;
}
