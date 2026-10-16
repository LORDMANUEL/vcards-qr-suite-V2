export function isVcardsOnlyMode() {
  return process.env.VCARDS_ONLY_MODE === 'true';
}

export const RETIRED_CAPTIVE_UI_PATHS = [
  '/portal',
  '/acceso',
  '/internet',
  '/usuarios',
  '/temas-portal',
  '/links',
  '/portales/sucursales',
  '/configuracion/portales',
  '/preview',
] as const;

export const RETIRED_CAPTIVE_API_PREFIXES = [
  '/api/access-points',
  '/api/portal',
  '/api/portal-config',
  '/api/portal-links',
  '/api/public/portal-info',
  '/api/radius',
] as const;

export function matchesPathPrefix(pathname: string, prefixes: readonly string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
