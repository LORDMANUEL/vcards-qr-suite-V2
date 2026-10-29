export function isThemeKind(value: unknown): value is 'CORPORATE' | 'FESTIVE' | 'SEASONAL' {
  return value === 'CORPORATE' || value === 'FESTIVE' || value === 'SEASONAL';
}
