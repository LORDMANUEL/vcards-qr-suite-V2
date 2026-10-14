import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateVCardString } from '@/lib/qr-generator';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Find vCard by qrCodeData
    const vcard = await prisma.vCard.findFirst({
      where: { qrCodeData: params.id },
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

    // Increment download count
    await prisma.vCard.update({
      where: { id: vcard.id },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
    });

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

    // Return as downloadable file
    return new NextResponse(vcardString, {
      headers: {
        'Content-Type': 'text/vcard',
        'Content-Disposition': `attachment; filename="${vcard?.user?.name?.replace(/\s+/g, '-')}.vcf"`,
      },
    });
  } catch (error) {
    console.error('Error downloading vCard:', error);
    return NextResponse.json(
      { error: 'Error al descargar vCard' },
      { status: 500 }
    );
  }
}
