import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canManageCompanies } from '@/lib/permissions';
import { getRequestedCompanyId } from '@/lib/branch-integrity';
import { themeAssignmentAllowed } from '@/lib/branch-theme-ownership';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const canManageAny = canManageCompanies(String(session.user.role));
        if (!canManageAny && session.user.branchId !== params.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const branch = await prisma.branch.findUnique({
            where: { id: params.id },
            include: {
                users: canManageAny ? {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        isActive: true,
                        createdAt: true
                    }
                } : false,
                company: true,
                portalTheme: true,
                vcardTheme: true,
                seasonalVcardTheme: true,
                portalConfig: true,
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

        if (!branch) {
            return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
        }

        return NextResponse.json({ branch });
    } catch (error) {
        console.error('Error fetching branch:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
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
            routerSerial, ssidTarget, setupGuide, uniqueSlug,
            portalConfig,
            vcardPositionThemeRules,
        } = body;

        // Company associations are changed only by explicit, validated reassignment.
        // Updating a theme or branch name must never null out companyId.
        let companyPatch: { companyId?: string; companyName?: string } = {};
        let requestedCompanyId: string | undefined;
        try {
            requestedCompanyId = getRequestedCompanyId(body);
        } catch {
            return NextResponse.json({ error: 'companyId debe ser un ID válido; no se permite desvincular desde este formulario' }, { status: 422 });
        }
        if (requestedCompanyId) {
            const selectedCompany = await prisma.company.findUnique({
                where: { id: requestedCompanyId },
                select: { id: true, name: true },
            });
            if (!selectedCompany) {
                return NextResponse.json({ error: 'Empresa seleccionada no encontrada' }, { status: 422 });
            }
            companyPatch = { companyId: selectedCompany.id, companyName: selectedCompany.name };
        }

        const current = await prisma.branch.findUnique({ where: { id: params.id }, select: { id: true, companyId: true } });
        if (!current) return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 });
        const effectiveCompanyId = requestedCompanyId || current.companyId;
        if (!effectiveCompanyId) return NextResponse.json({ error: 'Vincule primero la sucursal a una empresa' }, { status: 422 });

        const requestedThemes = [
          { id: vcardThemeId, category: 'VCARD' }, { id: seasonalVcardThemeId, category: 'VCARD' },
          { id: themeId, category: 'VCARD' }, { id: portalThemeId, category: 'PORTAL' },
          ...(Array.isArray(vcardPositionThemeRules) ? vcardPositionThemeRules.map((rule: any) => ({ id: rule?.themeId, category: 'VCARD' })) : []),
        ].filter(entry => typeof entry.id === 'string' && entry.id.length > 0);
        const themeRecords = requestedThemes.length ? await prisma.theme.findMany({
          where: { id: { in: requestedThemes.map(t => t.id) } },
          select: { id: true, companyId: true, category: true },
        }) : [];
        if (!themeAssignmentAllowed(themeRecords, requestedThemes, effectiveCompanyId)) {
          return NextResponse.json({ error: 'Un tema no existe, es de otro tipo o pertenece a otra empresa' }, { status: 422 });
        }

        // Atomic branch metadata + position rules: no partial update on failure.
        const branch = await prisma.$transaction(async tx => {
        const updated = await tx.branch.update({
            where: { id: params.id },
            data: {
                ...companyPatch,
                name,
                address,
                city,
                country,
                primaryColor,
                secondaryColor,
                logoUrl,
                portalThemeId,
                vcardThemeId,
                seasonalVcardThemeId,
                themeId,
                ...(typeof sortOrder === 'number' ? { sortOrder } : {}),
                routerSerial,
                ssidTarget,
                setupGuide,
                uniqueSlug,
                portalConfig: portalConfig ? {
                    upsert: {
                        create: {
                            collectName: portalConfig.collectName ?? true,
                            collectEmail: portalConfig.collectEmail ?? true,
                            collectPhone: portalConfig.collectPhone ?? true,
                            collectCarModel: portalConfig.collectCarModel ?? false,
                            collectVehicleYear: portalConfig.collectVehicleYear ?? false,
                            collectLicensePlate: portalConfig.collectLicensePlate ?? false,
                            requiredFields: portalConfig.requiredFields ?? []
                        },
                        update: {
                            collectName: portalConfig.collectName,
                            collectEmail: portalConfig.collectEmail,
                            collectPhone: portalConfig.collectPhone,
                            collectCarModel: portalConfig.collectCarModel,
                            collectVehicleYear: portalConfig.collectVehicleYear,
                            collectLicensePlate: portalConfig.collectLicensePlate,
                            requiredFields: portalConfig.requiredFields
                        }
                    }
                } : undefined,
            },
        });

        if (Array.isArray(vcardPositionThemeRules)) {
            for (const rule of vcardPositionThemeRules) {
                if (!rule?.positionGroup) continue;
                await tx.vCardPositionThemeRule.upsert({
                    where: {
                        branchId_positionGroup: {
                            branchId: params.id,
                            positionGroup: String(rule.positionGroup),
                        },
                    },
                    update: {
                        themeId: rule.themeId || null,
                        isEnabled: Boolean(rule.isEnabled),
                    },
                    create: {
                        branchId: params.id,
                        positionGroup: String(rule.positionGroup),
                        themeId: rule.themeId || null,
                        isEnabled: Boolean(rule.isEnabled),
                    },
                });
            }
        }

        return updated;
        }, { isolationLevel: 'Serializable' });

        const updatedBranch = await prisma.branch.findUnique({
            where: { id: params.id },
            include: {
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
            },
        });

        return NextResponse.json({ branch: updatedBranch || branch });
    } catch (error) {
        console.error('Error updating branch:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!canManageCompanies(String(session.user.role))) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  try {
    const result = await prisma.$transaction(async tx => {
      // Lock the parent row while checking *all* dependent relationships.
      const locked = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "Branch" WHERE "id" = ${params.id} FOR UPDATE
      `;
      if (!locked.length) return { status: 'missing' } as const;
      const branch = await tx.branch.findUnique({
        where: { id: params.id },
        select: { portalConfig: { select: { id: true } }, _count: { select: {
          users: true, vcards: true, accessPoints: true, portalSessions: true, vcardPositionThemeRules: true,
        } } },
      });
      if (!branch) return { status: 'missing' } as const;
      const counts = { ...branch._count, portalConfig: Number(Boolean(branch.portalConfig)) };
      if (Object.values(counts).some(n => n > 0)) return { status: 'blocked', counts } as const;
      await tx.branch.delete({ where: { id: params.id } });
      return { status: 'deleted' } as const;
    }, { isolationLevel: 'Serializable' });
    if (result.status === 'missing') return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 });
    if (result.status === 'blocked') {
      return NextResponse.json({ error: 'Esta sucursal conserva usuarios, QR, nodos o sesiones. No se puede eliminar.', dependencies: result.counts }, { status: 409 });
    }
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Branch delete transaction failed', error);
    return NextResponse.json({ error: 'Sucursal ocupada o cambió concurrentemente; no se eliminó.' }, { status: 409 });
  }
}
