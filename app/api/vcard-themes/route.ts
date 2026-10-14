import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { canManageThemes } from '@/lib/permissions';

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
        if (id) {
            const theme = await prisma.theme.findUnique({ where: { id } });
            return NextResponse.json({ theme });
        }

        const themes = await prisma.theme.findMany({
            where: { category: 'VCARD' },
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
        const body = await request.json();
        const { name, layoutJson, configJson, type, validFrom, validTo, cloneThemeId } = body;

        if (cloneThemeId) {
            const sourceTheme = await prisma.theme.findUnique({ where: { id: cloneThemeId } });
            if (!sourceTheme || sourceTheme.category !== 'VCARD') {
                return NextResponse.json({ error: 'Source theme not found' }, { status: 404 });
            }

            const clonedTheme = await prisma.theme.create({
                data: {
                    name: (name && String(name).trim()) || `${sourceTheme.name} copia`,
                    category: 'VCARD',
                    type: type || sourceTheme.type || 'CORPORATE',
                    colors: sourceTheme.colors,
                    config: (sourceTheme.config ?? {}) as any,
                    isActive: false,
                    validFrom: validFrom ? new Date(validFrom) : sourceTheme.validFrom,
                    validTo: validTo ? new Date(validTo) : sourceTheme.validTo,
                    typography: sourceTheme.typography,
                    bgImageUrl: sourceTheme.bgImageUrl,
                }
            });

            return NextResponse.json({ theme: clonedTheme, success: true });
        }

        const normalizedName = String(name || '').trim();

        if (!normalizedName || !layoutJson) {
            return NextResponse.json({ error: 'Name and layoutJson are required' }, { status: 400 });
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
                config: layoutJson,
                isActive: false,
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
        const { id, name, layoutJson, isActive, type, validFrom, validTo } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const headerBlock = layoutJson?.find((b: any) => b.type === 'Header');
        const primaryColor = headerBlock?.props?.bgColor || '#003478';
        const colorsJson = layoutJson ? JSON.stringify({ primary: primaryColor, secondary: '#FFFFFF', accent: '#10B981' }) : undefined;

        const normalizedName = typeof name === 'string' ? name.trim() : undefined;

        const theme = await prisma.$transaction(async (tx) => {
            if (isActive === true) {
                await tx.theme.updateMany({
                    where: { category: 'VCARD', NOT: { id } },
                    data: { isActive: false },
                });
            }

            return tx.theme.update({
                where: { id },
                data: {
                    ...(normalizedName ? { name: normalizedName } : {}),
                    ...(layoutJson ? { config: layoutJson, colors: colorsJson } : {}),
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
        await prisma.theme.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting theme:', error);
        return NextResponse.json({ error: 'Error deleting theme' }, { status: 500 });
    }
}