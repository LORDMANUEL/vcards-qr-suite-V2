import crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isStrongPassword(password: string): boolean {
  // At least 8 chars, one letter and one number.
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateRandomToken(size = 32): string {
  return crypto.randomBytes(size).toString('hex');
}

export function generateBase32Secret(byteLength = 20): string {
  const bytes = crypto.randomBytes(byteLength);
  let bits = '';
  for (const b of bytes) {
    bits += b.toString(2).padStart(8, '0');
  }

  let output = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5);
    if (chunk.length < 5) {
      output += BASE32_ALPHABET[parseInt(chunk.padEnd(5, '0'), 2)];
    } else {
      output += BASE32_ALPHABET[parseInt(chunk, 2)];
    }
  }

  return output;
}

function decodeBase32(secret: string): Buffer {
  const normalized = secret.toUpperCase().replace(/=+$/g, '').replace(/\s+/g, '');
  let bits = '';

  for (const char of normalized) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx < 0) {
      throw new Error('Invalid base32 secret');
    }
    bits += idx.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }

  return Buffer.from(bytes);
}

function generateHotp(secret: string, counter: number, digits = 6): string {
  const key = decodeBase32(secret);
  const counterBuffer = Buffer.alloc(8);

  let c = counter;
  for (let i = 7; i >= 0; i--) {
    counterBuffer[i] = c & 0xff;
    c = c >> 8;
  }

  const hmac = crypto.createHmac('sha1', key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const mod = 10 ** digits;
  return String(code % mod).padStart(digits, '0');
}

export function verifyTotpCode(secret: string, code: string, window = 1): boolean {
  const sanitizedCode = code.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(sanitizedCode)) {
    return false;
  }

  const period = 30;
  const nowCounter = Math.floor(Date.now() / 1000 / period);

  for (let i = -window; i <= window; i++) {
    const expected = generateHotp(secret, nowCounter + i, 6);
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sanitizedCode))) {
      return true;
    }
  }

  return false;
}

export function getOtpAuthUrl(email: string, secret: string): string {
  const issuer = encodeURIComponent('YC VCard System');
  const account = encodeURIComponent(email);
  return `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}
