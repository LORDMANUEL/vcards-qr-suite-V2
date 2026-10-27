const BUSINESS_TIME_ZONE = 'America/Tegucigalpa';
type ThemeDateValue = string | Date | null | undefined;
export interface ThemeDates { validFrom?: ThemeDateValue; validTo?: ThemeDateValue }

/** Legacy dates are calendar days entered in Honduras, not UTC instants. */
export function hondurasDate(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const get = (part: string) => parts.find((p) => p.type === part)?.value || '';
  return [get('year'), get('month'), get('day')].join('-');
}
function dateOnly(value: ThemeDateValue): string | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.toISOString().slice(0, 10) : null;
  const result = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(result) ? result : null;
}
export function isValidThemeDateRange(from?: ThemeDateValue, to?: ThemeDateValue): boolean {
  if (from && !dateOnly(from)) return false;
  if (to && !dateOnly(to)) return false;
  const start = dateOnly(from), end = dateOnly(to);
  return !start || !end || start <= end;
}
export function isVCardThemeInWindow(theme: ThemeDates | null | undefined, now: Date = new Date()): boolean {
  if (!theme || !isValidThemeDateRange(theme.validFrom, theme.validTo)) return false;
  const today = hondurasDate(now), start = dateOnly(theme.validFrom), end = dateOnly(theme.validTo);
  return (!start || today >= start) && (!end || today <= end);
}
