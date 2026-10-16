import { NextRequest, NextResponse } from 'next/server';
import {
  RETIRED_CAPTIVE_API_PREFIXES,
  RETIRED_CAPTIVE_UI_PATHS,
  isVcardsOnlyMode,
  matchesPathPrefix,
} from './lib/runtime-mode';

const ipPortPattern = /\b\d{1,3}(?:\.\d{1,3}){3}:\d{2,5}\b/;
const ipv4Pattern = /^\d{1,3}(?:\.\d{1,3}){3}$/;

function extractHost(value?: string): string {
  if (!value) return '';
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return value.toLowerCase().replace(/^https?:\/\//, '').replace(/:\d+$/, '');
  }
}

function getCanonicalPortalHost(): string {
  return (
    extractHost(process.env.PORTAL_CANONICAL_HOST) ||
    extractHost(process.env.NEXT_PUBLIC_PORTAL_BASE_URL) ||
    extractHost(process.env.NEXTAUTH_URL)
  );
}

function hasSessionCookie(req: NextRequest): boolean {
  return Boolean(
    req.cookies.get('next-auth.session-token')?.value ||
      req.cookies.get('__Secure-next-auth.session-token')?.value
  );
}

function isRepeatedHostPath(pathname: string, hostCandidates: string[]): boolean {
  const segments = pathname
    .split('/')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (segments.length === 0) return false;

  // Cases like /yctest.hopto.org/yctest.hopto.org/... or /190.107.136.92:9301/...
  const normalizedCandidates = hostCandidates.map((h) => h.toLowerCase()).filter(Boolean);
  const hostHits = segments.filter((s) => normalizedCandidates.includes(s)).length;
  if (hostHits >= 1 && segments.length >= 2) return true;

  // Also guard generic repeated domain-looking segments.
  const domainLike = segments.filter((s) => /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(s));
  if (domainLike.length >= 2 && new Set(domainLike).size === 1) return true;

  return false;
}

function hasMalformedPath(pathname: string): boolean {
  if (!pathname) return false;

  // Examples handled:
  // /190.107.136.92:9301/login
  // /190.107.136.92:9301/190.107.136.92:9301/.../login
  // /http://190.107.136.92:9301/login
  if (ipPortPattern.test(pathname)) return true;
  if (pathname.includes('http://') || pathname.includes('https://')) return true;

  return false;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isVcardsOnlyMode()) {
    if (matchesPathPrefix(pathname, RETIRED_CAPTIVE_API_PREFIXES)) {
      return NextResponse.json(
        { error: 'El portal cautivo se administra en un nodo independiente.' },
        { status: 410 }
      );
    }

    if (matchesPathPrefix(pathname, RETIRED_CAPTIVE_UI_PATHS)) {
      if (hasSessionCookie(req)) {
        return NextResponse.redirect(new URL('/portales', req.url));
      }
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Entrada exclusiva del panel VCards.
  if (req.nextUrl.pathname === '/') {
    return NextResponse.redirect(
      new URL('/vcards', req.url)
    );
  }

  const canonicalHost = getCanonicalPortalHost();
  const hostHeader = req.headers.get('host') || '';
  const reqHost = (hostHeader.includes(':') ? hostHeader.split(':')[0] : hostHeader).toLowerCase() || req.nextUrl.hostname.toLowerCase();

  const queryKeys = Array.from(new Set(req.nextUrl.searchParams.keys())).join(',');
  console.log(`[Middleware] Path: ${pathname}, HostHeader: ${hostHeader}, reqHost: ${reqHost}, queryKeys: ${queryKeys || 'none'}`);

  const portalFlowPath = pathname === '/' || pathname.startsWith('/portal') || pathname.startsWith('/acceso');
  const malformed = hasMalformedPath(pathname) || isRepeatedHostPath(pathname, [reqHost, canonicalHost]);
  
  // Linksys normalization
  const clientMac = req.nextUrl.searchParams.get('client_mac') || req.nextUrl.searchParams.get('status');
  const continueUrl = req.nextUrl.searchParams.get('continue_url') || req.nextUrl.searchParams.get('user_url');
  const apMac = req.nextUrl.searchParams.get('ap_mac');

  const isPortalLanding = search.includes('res=') || search.includes('mac=') || search.includes('uamip=') || !!clientMac || !!continueUrl;

  // If portal traffic arrives by IP and we have canonical domain, force domain for captive flow consistency.
  if (
    canonicalHost &&
    ipv4Pattern.test(reqHost) &&
    portalFlowPath &&
    !hasSessionCookie(req)
  ) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.hostname = canonicalHost;
    redirectUrl.pathname = pathname === '/' ? '/portal' : pathname;
    redirectUrl.search = search;
    return NextResponse.redirect(redirectUrl);
  }

  // Stop loop in middleware.
  if (pathname === '/' || pathname === '/portal') {
    const res = req.nextUrl.searchParams.get('res');
    const uamip = req.nextUrl.searchParams.get('uamip');
    const mac = req.nextUrl.searchParams.get('mac') || clientMac;
    
    // Si ya tenemos parámetros del portal, no redirigimos de nuevo si ya estamos en /portal
    if ((res && uamip) || mac) {
        if (pathname === '/portal') {
            return NextResponse.next();
        }
        // Si estamos en / pero con parámetros, vamos a /portal preservándolos
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = '/portal';
        return NextResponse.redirect(redirectUrl);
    }

    if (pathname === '/') {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = '/portal';
        return NextResponse.redirect(redirectUrl);
    }
  }

  // Normalize malformed/repeated-domain requests to clean portal URL on canonical host.
  if (malformed) {
    const redirectUrl = req.nextUrl.clone();
    if (canonicalHost) {
      redirectUrl.hostname = canonicalHost;
    }
    redirectUrl.pathname = '/portal';
    redirectUrl.search = search;
    return NextResponse.redirect(redirectUrl);
  }

  // Force /portal if we land on root with portal parameters, or if we are on canonical host root.
  if (pathname === '/' && isPortalLanding) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/portal';
    // No necesitamos clonar search, ya está en redirectUrl
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
