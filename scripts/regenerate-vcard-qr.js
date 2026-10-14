const { PrismaClient } = require('@prisma/client');
const QRCode = require('qrcode');
const CryptoJS = require('crypto-js');

const prisma = new PrismaClient();

function normalizeBaseUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.replace(/\/$/, '');
}

async function main() {
  const baseUrl = normalizeBaseUrl(process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL);
  const secret = process.env.NEXTAUTH_SECRET;

  if (!baseUrl) {
    throw new Error('NEXTAUTH_URL o NEXT_PUBLIC_SITE_URL es requerido para regenerar QR.');
  }

  if (!secret) {
    throw new Error('NEXTAUTH_SECRET es requerido para regenerar QR.');
  }

  const vcards = await prisma.vCard.findMany({
    select: { id: true, qrCodeData: true },
  });

  let updated = 0;
  for (const card of vcards) {
    if (!card.qrCodeData) continue;

    const signature = CryptoJS.HmacSHA256(card.qrCodeData, secret).toString(CryptoJS.enc.Hex);
    const publicUrl = `${baseUrl}/vcard/${card.qrCodeData}?sig=${signature}`;
    const qrImageUrl = await QRCode.toDataURL(publicUrl, {
      width: 400,
      margin: 2,
      color: { dark: '#003478', light: '#FFFFFF' },
    });

    await prisma.vCard.update({
      where: { id: card.id },
      data: { qrImageUrl },
    });

    updated += 1;
    if (updated % 50 === 0) {
      console.log(`Regeneradas ${updated} vCards...`);
    }
  }

  console.log(`Proceso completado. vCards actualizadas: ${updated}`);
}

main()
  .catch((err) => {
    console.error('Error regenerando QR de vCards:', err.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
