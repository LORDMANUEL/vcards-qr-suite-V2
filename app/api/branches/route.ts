import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isScopedDirectoryAllowed, scopedDirectoryBranchId } from '@/lib/directory-scope';
import { canManageCompanies } from '@/lib/permissions';
import { validBranchRegistration } from '@/lib/branch-create-policy';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const branchId = scopedDirectoryBranchId(String(session.user.role), session.user.branchId);
    if (!isScopedDirectoryAllowed(branchId)) return NextResponse.json({ error: 'Sin sucursal asignada' }, { status: 403 });

    const branches = await prisma.branch.findMany({
      ...(branchId ? { where: { id: branchId } } : {}),
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
      return NextResponse.json({ error: 'Sin permisos para crear sucursales' }, { status: 403 });
    }
    const body = await req.json().catch(() => null);
    const validated = validBranchRegistration(body);
    if (!validated.ok) return NextResponse.json({ error: validated.error }, { status: 400 });
    const { companyId, name, city } = validated;
    const {
      address, country, sortOrder, primaryColor, secondaryColor, logoUrl,
      portalThemeId, vcardThemeId, seasonalVcardThemeId, themeId,
      routerSerial, ssidTarget, setupGuide, uniqueSlug,
    } = body as Record<string, any>;

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    const existing = await prisma.branch.findFirst({
      where: { companyId, name: { equals: name, mode: 'insensitive' }, city: { equals: city, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing) return NextResponse.json({ error: 'La sucursal ya existe en esta empresa' }, { status: 409 });

    // Never use a user-submitted company display name to bind a branch.
    const resolvedCompanyName = company.name;
    const resolvedThemeId = vcardThemeId || company.defaultVcardThemeId || null;
    const resolvedSeasonalThemeId = seasonalVcardThemeId || company.seasonalVcardThemeId || null;
    const resolvedPrimaryColor = primaryColor || company.primaryColor;
    const resolvedSecondaryColor = secondaryColor || company.secondaryColor;
    const resolvedLogoUrl = logoUrl || company.logoUrl;

    // Do not attach another company's theme via this generic branch endpoint.
    const referenced = [resolvedThemeId, resolvedSeasonalThemeId, portalThemeId, themeId].filter((x): x is string => typeof x === 'string' && x.length > 0);
    if (referenced.length) {
      const themes = await prisma.theme.findMany({ where: { id: { in: referenced } }, select: { id: true, companyId: true } });
      if (themes.length !== new Set(referenced).size || themes.some(t => t.companyId && t.companyId !== companyId)) {
        return NextResponse.json({ error: 'Un tema no existe o pertenece a otra empresa' }, { status: 422 });
      }
    }
    const lastBranch = await prisma.branch.findFirst({
      where: companyId ? { companyId } : undefined,
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const branch = await prisma.branch.create({
      data: {
        companyName: resolvedCompanyName,
        companyId,
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
        uniqueSlug: typeof uniqueSlug === 'string' && uniqueSlug.trim() ? uniqueSlug.trim() : null
      },
    });

    return NextResponse.json({ branch }, { status: 201 });
  } catch (error) {
    console.error('Error creating branch:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}