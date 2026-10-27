/** A theme may be deleted only if no stored entity references its ID.
 * Counts are fetched by the authenticated API. Zero references = unused draft.
 */
export interface ThemeReferenceCounts {
  companies: number;
  branches: number;
  positionRules: number;
  accessPoints: number;
}
export function canDeleteTheme(refs: ThemeReferenceCounts): boolean {
  return Object.values(refs).every(count => Number.isInteger(count) && count === 0);
}
