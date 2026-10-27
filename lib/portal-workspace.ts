/** Portal admin routes share an isolated menu without changing their legacy URLs. */
const PORTAL_PATHS = [
  '/portal-admin', '/usuarios', '/temas-portal',
  '/portales/sucursales', '/links', '/promociones', '/ubicaciones',
  '/configuracion/portales',
] as const;

export function isPortalWorkspacePath(pathname: string): boolean {
  return PORTAL_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'));
}
