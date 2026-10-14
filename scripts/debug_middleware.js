require('dotenv').config({ path: '/home/yc/vcard-system/.env' });
const { URL } = require('url');

function extractHost(value) {
  if (!value) return '';
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return value.toLowerCase().replace(/^https?:\/\//, '').replace(/:\d+$/, '');
  }
}

function getCanonicalPortalHost() {
  return (
    extractHost(process.env.PORTAL_CANONICAL_HOST) ||
    extractHost(process.env.NEXT_PUBLIC_PORTAL_BASE_URL) ||
    extractHost(process.env.NEXTAUTH_URL)
  );
}

const reqHost = "yctest.hopto.org";
const canonical = getCanonicalPortalHost();
const pathname = "/";

console.log("None:", extractHost(undefined));
console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
console.log("NEXT_PUBLIC_PORTAL_BASE_URL:", process.env.NEXT_PUBLIC_PORTAL_BASE_URL);
console.log("ReqHost:", reqHost);
console.log("Canonical:", canonical);
console.log("Redirect needed:", Boolean(canonical && reqHost === canonical && pathname === '/'));

// Malformed check
const ipPortPattern = /\b\d{1,3}(?:\.\d{1,3}){3}:\d{2,5}\b/;
const ipv4Pattern = /^\d{1,3}(?:\.\d{1,3}){3}$/;

function hasMalformedPath(pathname) {
  if (!pathname) return false;
  if (ipPortPattern.test(pathname)) return true;
  if (pathname.includes('http://') || pathname.includes('https://')) return true;
  return false;
}

console.log("Malformed:", hasMalformedPath(pathname));
