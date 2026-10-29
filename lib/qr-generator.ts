import QRCode from 'qrcode';
import { serializeVcfLines } from './vcf-format';

function sanitizeVCardValue(value?: string): string {
  if (!value) return '';

  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .trim();
}

export async function generateQRCode(data: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#003478',
        light: '#FFFFFF',
      },
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

export function generateVCardString(data: {
  name: string;
  position?: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  address?: string;
  photoUrl?: string;
}): string {
  const name = sanitizeVCardValue(data.name);
  const position = sanitizeVCardValue(data.position);
  const email = sanitizeVCardValue(data.email);
  const phone = sanitizeVCardValue(data.phone);
  const company = sanitizeVCardValue(data.company);
  const website = sanitizeVCardValue(data.website);
  const address = sanitizeVCardValue(data.address);
  const photoUrl = sanitizeVCardValue(data.photoUrl);

  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${name}`,
    position ? `TITLE:${position}` : '',
    company ? `ORG:${company}` : '',
    `EMAIL:${email}`,
    phone ? `TEL:${phone}` : '',
    website ? `URL:${website}` : '',
    address ? `ADR:;;${address};;;;` : '',
    photoUrl ? `PHOTO;VALUE=URL:${photoUrl}` : '',
    'END:VCARD',
  ]
    .filter(Boolean);

  return serializeVcfLines(vcard);
}
