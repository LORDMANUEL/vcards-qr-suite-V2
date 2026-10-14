import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { securityCheck } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // SECURITY: Anti-cloning & Scraping validation
    const security = await securityCheck(request, params.id);
    if (!security.allowed) return security.response;

    // Find vCard by qrCodeData (the ID in the URL)
    const vcard = await prisma.vCard.findFirst({
      where: { qrCodeData: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            position: true,
            email: true,
            phone: true,
            photoUrl: true,
            website: true,
          },
        },
        branch: {
          select: {
            id: true,
            companyName: true,
            company: {
              include: {
                defaultVcardTheme: true,
                seasonalVcardTheme: true,
              },
            },
            name: true,
            address: true,
            logoUrl: true,
            primaryColor: true,
            secondaryColor: true,
            theme: true, // Legacy
            vcardTheme: true, // New
            seasonalVcardTheme: true,
            vcardPositionThemeRules: {
              include: {
                theme: true,
              },
              orderBy: { positionGroup: 'asc' },
            },
          },
        },
      },
    });

    if (!vcard) {
      return NextResponse.json(
        { error: 'vCard no encontrada' },
        { status: 404 }
      );
    }

    const activeGlobalTheme = await prisma.theme.findFirst({
      where: { category: 'VCARD', isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ vcard, activeGlobalTheme });
  } catch (error) {
    console.error('Error fetching vCard:', error);
    return NextResponse.json(
      { error: 'Error al obtener vCard' },
      { status: 500 }
    );
  }
}
