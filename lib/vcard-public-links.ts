/** Canonical vCard URL must come from deployment configuration, not Host headers. */
export type PublicVCardUrlEnv = {
  NEXT_PUBLIC_VCARD_BASE_URL?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  NEXTAUTH_URL?: string;
};
export function resolvePublicVCardBaseUrl(env: PublicVCardUrlEnv): string {
  const value = env.NEXT_PUBLIC_VCARD_BASE_URL || env.NEXT_PUBLIC_SITE_URL || env.NEXTAUTH_URL;
  if (!value) throw new Error('Falta NEXT_PUBLIC_VCARD_BASE_URL, NEXT_PUBLIC_SITE_URL o NEXTAUTH_URL');
  let url: URL;
  try { url = new URL(value); }
  catch { throw new Error('La URL pública configurada no es válida'); }
  if (!['http:', 'https:'].includes(url.protocol)
    || !url.hostname || url.username || url.password || url.search || url.hash
    || url.pathname !== '/') {
    throw new Error('La URL pública debe ser un origen HTTP(S) sin credenciales, ruta, query ni fragmento');
  }
  return url.origin;
}

/** Reuse the QR signature from the current public URL in both API and download requests. */
export function publicVCardApiPath(id: string, type: 'profile' | 'download', search = ''): string {
  const path = `/api/vcard/${encodeURIComponent(id)}${type === 'download' ? '/download' : ''}`;
  const sig = new URLSearchParams(search).get('sig');
  return sig ? `${path}?sig=${encodeURIComponent(sig)}` : path;
}
