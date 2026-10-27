/** Report dates are Honduras local calendar days (UTC-06, no DST). */
function parseLocalDay(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const day = new Date(value + 'T06:00:00.000Z');
  return Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== value
    ? null : day;
}
export type ScanQuery =
  | { ok: true; page: number; limit: number; from?: Date; to?: Date }
  | { ok: false; error: string };
export function parseScanReportQuery(params: URLSearchParams): ScanQuery {
  const pageString = params.get('page') || '0';
  const limitString = params.get('limit') || '20';
  if (!/^\d{1,6}$/.test(pageString) || !/^\d{1,3}$/.test(limitString)) {
    return { ok: false, error: 'Paginación inválida' };
  }
  const page = Number(pageString), limit = Number(limitString);
  if (page > 100000 || limit < 1 || limit > 100 || page * limit > 100000) {
    return { ok: false, error: 'Paginación fuera de límites' };
  }
  const fromString = params.get('from'), toString = params.get('to');
  const from = fromString ? parseLocalDay(fromString) : undefined;
  const endDay = toString ? parseLocalDay(toString) : undefined;
  if ((fromString && !from) || (toString && !endDay)) {
    return { ok: false, error: 'Use fechas válidas YYYY-MM-DD' };
  }
  if (from && endDay && from > endDay) return { ok: false, error: 'Fecha inicial posterior a final' };
  const to = endDay ? new Date(endDay.getTime() + 86400000) : undefined;
  return { ok: true, page, limit, ...(from ? { from } : {}), ...(to ? { to } : {}) };
}
