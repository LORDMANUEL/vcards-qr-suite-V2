import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { canManageThemes } from '@/lib/permissions';
import { isValidThemeDateRange } from '@/lib/vcard-theme-calendar';
import { persistVCardTheme } from '@/lib/vcard-theme-format';
import { canCloneThemeInCompany } from '@/lib/theme-clone-access';
import { canManageCompanies } from '@/lib/permissions';
import { canDeleteTheme } from '@/lib/vcard-theme-deletion';
import { canReadTheme, canWriteTheme } from '@/lib/theme-tenant-access';

async function themeActor(session: { user?: { role?: string; branchId?: string | null } }) {
  const admin = canManageCompanies(String(session.user?.role));
  if (admin) return { admin, companyId: null };
  const branch = session.user?.branchId ? await prisma.branch.findUnique({
    where: { id: session.user.branchId }, select: { companyId: true },
  }) : null;
  return { admin, companyId: branch?.companyId || null };
}

/** Check every live theme pointer: isActive alone is not sufficient (legacy data).
 * Editing a published theme in place can alter public vCards without approval.
 */
async function isPublishedTheme(id: string): Promise<boolean> {
    const [companies, branches, positions] = await Promise.all([
        prisma.company.count({ where: { OR: [{ defaultVcardThemeId: id }, { seasonalVcardThemeId: id }] } }),
        prisma.branch.count({ where: { OR: [{ vcardThemeId: id }, { seasonalVcardThemeId: id }, { themeId: id }] } }),
        prisma.vCardPositionThemeRule.count({ where: { themeId: id, isEnabled: true } }),
    ]);
    return companies + branches + positions > 0;
}

// GET - Lista todos los temas vCard o uno específico por ID
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!canManageThemes(String(session.user?.role))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    try {
        const actor = await themeActor(session);
        if (!actor.admin && !actor.companyId) return NextResponse.json({ error: 'Sin sucursal vinculada' }, { status: 403 });
        if (id) {
            const theme = await prisma.theme.findUnique({ where: { id } });
            if (!theme || theme.category !== 'VCARD' || !canReadTheme(actor, theme)) {
                return NextResponse.json({ error: 'Tema no encontrado' }, { status: 404 });
            }
            return NextResponse.json({ theme, published: await isPublishedTheme(id) });
        }

        const themes = await prisma.theme.findMany({
            where: { category: 'VCARD', ...(actor.admin ? {} : {
              OR: [{ companyId: actor.companyId }, { companyId: null, isActive: true }],
            }) },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({ themes });
    } catch (error) {
        console.error('Error fetching themes:', error);
        return NextResponse.json({ error: 'Error fetching themes' }, { status: 500 });
    }
}

// POST - Crear un nuevo tema de vCard
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!canManageThemes(String(session.user?.role))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const actor = await themeActor(session);
        if (!actor.admin && !actor.companyId) {
            return NextResponse.json({ error: 'Vincule su usuario a una sucursal antes de diseñar temas' }, { status: 403 });
        }
        const body = await request.json();
        const { name, layoutJson, studioDoc, type, validFrom, validTo, cloneThemeId } = body;
        if (!isValidThemeDateRange(validFrom, validTo)) return NextResponse.json({ error: 'Rango de fechas inválido' }, { status: 422 });

        if (cloneThemeId) {
            const sourceTheme = await prisma.theme.findUnique({ where: { id: cloneThemeId } });
            if (!sourceTheme || sourceTheme.category !== 'VCARD') {
                return NextResponse.json({ error: 'Source theme not found' }, { status: 404 });
            }
            const role = String(session.user?.role);
            const viewerBranch = session.user?.branchId ? await prisma.branch.findUnique({
                where: { id: session.user.branchId }, select: { companyId: true },
            }) : null;
            if (!canCloneThemeInCompany(canManageCompanies(role), viewerBranch?.companyId, sourceTheme.companyId)) {
                return NextResponse.json({ error: 'No puede clonar diseños de otra empresa' }, { status: 403 });
            }

            const clonedTheme = await prisma.theme.create({
                data: {
                    name: (name && String(name).trim()) || `${sourceTheme.name} copia`,
                    category: 'VCARD',
                    type: type || sourceTheme.type || 'CORPORATE',
                    colors: sourceTheme.colors,
                    config: (sourceTheme.config ?? {}) as any,
                    isActive: false,
                    companyId: canManageCompanies(role) ? null : viewerBranch?.companyId,
                    validFrom: validFrom ? new Date(validFrom) : null,
                    validTo: validTo ? new Date(validTo) : null,
                    typography: sourceTheme.typography,
                    bgImageUrl: sourceTheme.bgImageUrl,
                }
            });

            return NextResponse.json({ theme: clonedTheme, success: true });
        }

        const normalizedName = String(name || '').trim();

        if (!normalizedName || !Array.isArray(layoutJson)) {
            return NextResponse.json({ error: 'Nombre y bloques de diseño requeridos' }, { status: 400 });
        }
        if (studioDoc !== undefined && JSON.stringify(studioDoc).length > 2000000) {
            return NextResponse.json({ error: 'El diseño excede 2 MB. Use URLs de imágenes optimizadas.' }, { status: 413 });
        }
        let themeConfig: ReturnType<typeof persistVCardTheme>;
        try {
            themeConfig = persistVCardTheme(layoutJson, studioDoc);
        } catch {
            return NextResponse.json({ error: 'Estructura del diseño inválida' }, { status: 422 });
        }

        // Extraer "primary color" del primer bloque Header
        const headerBlock = layoutJson.find((b: any) => b.type === 'Header');
        const primaryColor = headerBlock?.props?.bgColor || '#003478';
        const colorsJson = JSON.stringify({ primary: primaryColor, secondary: '#FFFFFF', accent: '#10B981' });

        const theme = await prisma.theme.create({
            data: {
                name: normalizedName,
                category: 'VCARD',
                type: type || 'CORPORATE',
                colors: colorsJson,
                config: themeConfig as any,
                isActive: false,
                companyId: actor.companyId,
                validFrom: validFrom ? new Date(validFrom) : null,
                validTo: validTo ? new Date(validTo) : null,
            }
        });

        return NextResponse.json({ theme, success: true });
    } catch (error) {
        console.error('Error creating theme:', error);
        return NextResponse.json({ error: 'Error creating theme' }, { status: 500 });
    }
}

// PUT - Actualizar un tema de vCard
export async function PUT(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!canManageThemes(String(session.user?.role))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { id, name, layoutJson, studioDoc, isActive, type, validFrom, validTo } = body;
        if (!isValidThemeDateRange(validFrom, validTo)) return NextResponse.json({ error: 'Rango de fechas inválido' }, { status: 422 });

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }
        const actor = await themeActor(session);
        const owned = await prisma.theme.findUnique({ where: { id }, select: { category: true, companyId: true } });
        if (!owned || owned.category !== 'VCARD') return NextResponse.json({ error: 'Tema no encontrado' }, { status: 404 });
        if (!canWriteTheme(actor, owned)) return NextResponse.json({ error: 'Tema de otra compañía o global protegido' }, { status: 403 });
        if (layoutJson !== undefined && !Array.isArray(layoutJson)) {
            return NextResponse.json({ error: 'Los bloques deben ser una lista' }, { status: 422 });
        }
        if (studioDoc !== undefined && JSON.stringify(studioDoc).length > 2000000) {
            return NextResponse.json({ error: 'El diseño excede 2 MB. Use imágenes por URL.' }, { status: 413 });
        }
        let themeConfig: ReturnType<typeof persistVCardTheme> | undefined;
        if (layoutJson !== undefined) {
            try {
                themeConfig = persistVCardTheme(layoutJson, studioDoc);
            } catch {
                return NextResponse.json({ error: 'Estructura del diseño inválida' }, { status: 422 });
            }
            const current = await prisma.theme.findUnique({ where: { id }, select: { id: true, category: true, isActive: true } });
            if (!current || current.category !== 'VCARD') return NextResponse.json({ error: 'Tema no encontrado' }, { status: 404 });
            if (current.isActive || await isPublishedTheme(id)) {
                return NextResponse.json({
                    code: 'THEME_PUBLISHED',
                    error: 'El tema está publicado. Guarde los cambios como nuevo borrador para no modificar las tarjetas activas.',
                }, { status: 409 });
            }
        }

        const headerBlock = layoutJson?.find((b: any) => b.type === 'Header');
        const primaryColor = headerBlock?.props?.bgColor || '#003478';
        const colorsJson = layoutJson ? JSON.stringify({ primary: primaryColor, secondary: '#FFFFFF', accent: '#10B981' }) : undefined;

        const normalizedName = typeof name === 'string' ? name.trim() : undefined;

        const theme = await prisma.$transaction(async (tx) => {
            // isActive is a theme availability flag, not a unique global publication.
            // Never deactivate themes of unrelated companies here.
            return tx.theme.update({
                where: { id },
                data: {
                    ...(normalizedName ? { name: normalizedName } : {}),
                    ...(themeConfig !== undefined ? { config: themeConfig as any, colors: colorsJson } : {}),
                    ...(isActive !== undefined ? { isActive } : {}),
                    ...(type ? { type } : {}),
                    ...(validFrom !== undefined ? { validFrom: validFrom ? new Date(validFrom) : null } : {}),
                    ...(validTo !== undefined ? { validTo: validTo ? new Date(validTo) : null } : {}),
                }
            });
        });

        return NextResponse.json({ theme, success: true });
    } catch (error) {
        console.error('Error updating theme:', error);
        return NextResponse.json({ error: 'Error updating theme' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!canManageThemes(String(session.user?.role))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    try {
        const actor = await themeActor(session);
        const deleted = await prisma.$transaction(async (tx) => {
            const theme = await tx.theme.findUnique({ where: { id }, select: { id: true, category: true, companyId: true } });
            if (!theme || theme.category !== 'VCARD') return { status: 404, error: 'Tema vCard no encontrado' } as const;
            if (!canWriteTheme(actor, theme)) return { status: 403, error: 'Solo puede eliminar borradores de su empresa' } as const;

            const [companies, branches, positionRules, accessPoints] = await Promise.all([
                tx.company.count({ where: { OR: [{ defaultVcardThemeId: id }, { seasonalVcardThemeId: id }] } }),
                tx.branch.count({
                    where: { OR: [{ vcardThemeId: id }, { seasonalVcardThemeId: id }, { themeId: id }, { portalThemeId: id }] },
                }),
                // Include disabled rules: they are stored references still protected by FK.
                tx.vCardPositionThemeRule.count({ where: { themeId: id } }),
                tx.accessPoint.count({ where: { themeId: id } }),
            ]);
            const references = { companies, branches, positionRules, accessPoints };
            if (!canDeleteTheme(references)) {
                return { status: 409, error: 'El tema todavía está asignado. Desvincúlelo de empresas, sucursales, puestos o nodos antes de eliminarlo.', references } as const;
            }

            await tx.theme.delete({ where: { id } });
            return { success: true } as const;
        }, { isolationLevel: 'Serializable' });

        if ('error' in deleted) {
            return NextResponse.json({ error: deleted.error, code: deleted.status === 409 ? 'THEME_IN_USE' : 'NOT_FOUND', ...('references' in deleted ? { references: deleted.references } : {}) }, { status: deleted.status });
        }
        return NextResponse.json(deleted);
    } catch (error: any) {
        // Concurrent assignment and FK constraints must not be reported as a
        // successful delete (or trigger a cascade into published references).
        if (error?.code === 'P2003' || error?.code === 'P2034') {
            return NextResponse.json({ error: 'El tema tiene referencias o cambió durante la eliminación. Actualice el catálogo e inténtelo de nuevo.', code: 'THEME_IN_USE' }, { status: 409 });
        }
        console.error('Error deleting theme:', error);
        return NextResponse.json({ error: 'No se pudo eliminar el tema' }, { status: 500 });
    }
}
