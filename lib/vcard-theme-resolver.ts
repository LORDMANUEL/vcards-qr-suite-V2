import { isVCardThemeInWindow, type ThemeDates } from './vcard-theme-calendar';

/** A theme is eligible only if published/active and within the Honduras date window.
 * Legacy themes with no date restriction remain eligible; unpublished drafts do not.
 */
export interface PublicVCardTheme extends ThemeDates {
  isActive?: boolean | null;
}
export interface PublicThemeCandidates<T extends PublicVCardTheme> {
  role?: T | null;
  branchSeasonal?: T | null;
  branchCorporate?: T | null;
  companySeasonal?: T | null;
  companyCorporate?: T | null;
  global?: T | null;
  legacy?: T | null;
}

export function resolveVCardTheme<T extends PublicVCardTheme>(
  candidates: PublicThemeCandidates<T>,
  now: Date = new Date(),
): T | null {
  const preference: Array<T | null | undefined> = [
    candidates.role,
    candidates.branchSeasonal,
    candidates.branchCorporate,
    candidates.companySeasonal,
    candidates.companyCorporate,
    candidates.global,
    candidates.legacy,
  ];
  return preference.find(theme => theme?.isActive === true && isVCardThemeInWindow(theme, now)) || null;
}
