import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canManageCompanies } from '@/lib/permissions';
import { getRequestedCompanyId } from '@/lib/branch-integrity';

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

        const branch = await prisma.branch.update({
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
                await prisma.vCardPositionThemeRule.upsert({
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

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!canManageCompanies(String(session.user.role))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const branch = await prisma.branch.findUnique({
            where: { id: params.id },
            select: {
                id: true,
                portalConfig: { select: { id: true } },
                _count: {
                    select: {
                        users: true,
                        vcards: true,
                        accessPoints: true,
                        portalSessions: true,
                        vcardPositionThemeRules: true,
                    }
                }
            }
        });

        if (!branch) {
            return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
        }

        const hasDependencies =
            branch._count.users > 0 ||
            branch._count.vcards > 0 ||
            branch._count.accessPoints > 0 ||
            branch._count.portalSessions > 0 ||
            branch._count.vcardPositionThemeRules > 0 ||
            Boolean(branch.portalConfig);

        if (hasDependencies) {
            return NextResponse.json({
                error: 'No se puede borrar la sucursal porque tiene datos asociados (usuarios, vcards, access points, sesiones o reglas de tema por puesto).',
                dependencies: {
                    users: branch._count.users,
                    vcards: branch._count.vcards,
                    accessPoints: branch._count.accessPoints,
                    portalSessions: branch._count.portalSessions,
                    vcardPositionThemeRules: branch._count.vcardPositionThemeRules,
                    portalConfig: Boolean(branch.portalConfig),
                }
            }, { status: 409 });
        }

        await prisma.branch.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: 'Branch deleted successfully' });
    } catch (error) {
        console.error('Error deleting branch:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}