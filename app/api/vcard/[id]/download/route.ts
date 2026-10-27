import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateVCardString } from '@/lib/qr-generator';
import { securityCheck } from '@/lib/security';
import { safeVcfFilename } from '@/lib/safe-vcf-filename';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const security = await securityCheck(request, params.id);
    if (!security.allowed) return security.response;

    // Find vCard by qrCodeData
    const vcard = await prisma.vCard.findFirst({
      where: { qrCodeData: params.id, isActive: true, user: { isActive: true } },
      include: {
        user: true,
        branch: true,
      },
    });

    if (!vcard) {
      return NextResponse.json(
        { error: 'vCard no encontrada' },
        { status: 404 }
      );
    }

    // Generate vCard string
    const vcardString = generateVCardString({
      name: vcard?.user?.name ?? '',
      position: vcard?.user?.position ?? undefined,
      email: vcard?.user?.email ?? '',
      phone: vcard?.user?.phone ?? undefined,
      company: vcard?.branch?.name ?? 'Ford Yude Canahuati',
      website: vcard?.user?.website ?? undefined,
      address: vcard?.branch?.address ?? undefined,
      photoUrl: vcard?.user?.photoUrl ?? undefined,
    });

    const response = new NextResponse(vcardString, {
      headers: {
        'Content-Type': 'text/vcard; charset=utf-8',
        'Content-Disposition': `attachment; filename="${safeVcfFilename(vcard.user.name)}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
    // Do not count a failed VCF serialization as a successful download.
    // Archived cards cannot receive a new download after the initial read.
    const counted = await prisma.vCard.updateMany({
      where: { id: vcard.id, isActive: true },
      data: { downloadCount: { increment: 1 } },
    });
    if (counted.count === 0) {
      return NextResponse.json({ error: 'vCard desactivada' }, { status: 404 });
    }
    return response;
  } catch (error) {
    console.error('Error downloading vCard:', error);
    return NextResponse.json(
      { error: 'Error al descargar vCard' },
      { status: 500 }
    );
  }
}
