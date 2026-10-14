type LocationResult = {
  country: string;
  city: string;
};

const LOCATION_TIMEOUT_MS = 1500;
const CACHE_TTL_MS = 10 * 60 * 1000;
const locationCache = new Map<string, { value: LocationResult; expiresAt: number }>();

function isPrivateOrLocalIp(ip: string) {
  return ip === '::1' ||
    ip === '127.0.0.1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip);
}

export async function getLocationFromIP(ip: string) {
  try {
    if (!ip || isPrivateOrLocalIp(ip)) {
      return { country: 'Honduras', city: 'San Pedro Sula' };
    }

    const cached = locationCache.get(ip);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LOCATION_TIMEOUT_MS);
    const response = await fetch(`https://ipapi.co/${ip}/json/`, { signal: controller.signal });
    clearTimeout(timer);
    if (!response?.ok) {
      return { country: 'Unknown', city: 'Unknown' };
    }

    const data = await response.json();
    const result = {
      country: data?.country_name ?? 'Unknown',
      city: data?.city ?? 'Unknown',
    };

    locationCache.set(ip, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  } catch (error) {
    console.error('Error fetching location:', error);
    return { country: 'Unknown', city: 'Unknown' };
  }
}

export function getDeviceType(userAgent: string): string {
  if (!userAgent) return 'Unknown';
  
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'Mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'Tablet';
  }
  return 'Desktop';
}
