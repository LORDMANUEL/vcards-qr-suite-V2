import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canManageCompanies, canViewVcards } from '@/lib/permissions';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManageAny = canManageCompanies(String(session.user.role));
    if (!canManageAny && !canViewVcards(String(session.user.role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!canManageAny && !session.user.branchId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const branches = await prisma.branch.findMany({
      where: canManageAny ? undefined : { id: session.user.branchId! },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: { users: true, vcards: true }
        },
        company: true,
        portalTheme: true,
        vcardTheme: true,
        seasonalVcardTheme: true,
        vcardPositionThemeRules: {
          include: {
            theme: {
              select: {
                id: true,
                name: true,
                isActive: true,
              },
            },
          },
          orderBy: { positionGroup: 'asc' },
        },
      }
    });

    return NextResponse.json({ branches });
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!canManageCompanies(String(session.user.role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      companyName, companyId, name, address, city, country, sortOrder,
      primaryColor, secondaryColor, logoUrl,
      portalThemeId, vcardThemeId, seasonalVcardThemeId, themeId,
      routerSerial, ssidTarget, setupGuide, uniqueSlug
    } = body;

    let resolvedCompanyName = companyName;
    let resolvedThemeId = vcardThemeId;
    let resolvedSeasonalThemeId = seasonalVcardThemeId;
    let resolvedPrimaryColor = primaryColor || '#003478';
    let resolvedSecondaryColor = secondaryColor || '#FFFFFF';
    let resolvedLogoUrl = logoUrl;

    if (companyId) {
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      if (!company) {
        return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
      }
      resolvedCompanyName = company.name;
      resolvedThemeId = resolvedThemeId || company.defaultVcardThemeId || null;
      resolvedSeasonalThemeId = resolvedSeasonalThemeId || company.seasonalVcardThemeId || null;
      resolvedPrimaryColor = primaryColor || company.primaryColor;
      resolvedSecondaryColor = secondaryColor || company.secondaryColor;
      resolvedLogoUrl = logoUrl || company.logoUrl;
    }

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'Nombre de sucursal requerido' }, { status: 400 });
    }

    const lastBranch = await prisma.branch.findFirst({
      where: companyId ? { companyId } : undefined,
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const branch = await prisma.branch.create({
      data: {
        companyName: resolvedCompanyName,
        companyId: companyId || null,
        name,
        address,
        city,
        country,
        primaryColor: resolvedPrimaryColor,
        secondaryColor: resolvedSecondaryColor,
        logoUrl: resolvedLogoUrl,
        portalThemeId,
        vcardThemeId: resolvedThemeId,
        seasonalVcardThemeId: resolvedSeasonalThemeId,
        themeId,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : (lastBranch?.sortOrder ?? -1) + 1,
        routerSerial,
        ssidTarget,
        setupGuide,
        uniqueSlug
      },
    });

    return NextResponse.json({ branch }, { status: 201 });
  } catch (error) {
    console.error('Error creating branch:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
