import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { canManageCompanies, canManageThemes } from '@/lib/permissions';
import { isSameCompanyScope, isVCardThemeScope, themeSlot } from '@/lib/theme-scope';

export const dynamic = 'force-dynamic';

/**
 * Publish a theme only for one company or one of its branches.
 * Replaces the old client loop that updated every branch in all companies.
 * This is a compatibility layer over existing Company/Branch theme pointers;
 * scheduling/versions are intentionally deferred to the ThemePublication migration.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const role = String(session.user.role);
  if (!canManageThemes(role)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const themeId = body?.themeId;
  const scope = body?.scope;
  const targetId = body?.targetId;
  if (typeof themeId !== 'string' || !themeId || typeof targetId !== 'string' || !targetId
      || !isVCardThemeScope(scope)) {
    return NextResponse.json({ error: 'Indique themeId, scope (company|branch) y targetId' }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const theme = await tx.theme.findUnique({ where: { id: themeId } });
      if (!theme || theme.category !== 'VCARD') {
        return { error: 'Tema vCard no encontrado', status: 404 } as const;
      }

      let companyId: string;
      if (scope === 'company') {
        if (!canManageCompanies(role)) return { error: 'Solo administradores pueden publicar para toda una empresa', status: 403 } as const;
        const company = await tx.company.findUnique({ where: { id: targetId }, select: { id: true } });
        if (!company) return { error: 'Empresa no encontrada', status: 404 } as const;
        companyId = company.id;
      } else {
        const branch = await tx.branch.findUnique({ where: { id: targetId }, select: { id: true, companyId: true } });
        if (!branch || !branch.companyId) return { error: 'Sucursal inexistente o sin empresa vinculada', status: 422 } as const;
        if (!canManageCompanies(role) && session.user.branchId !== branch.id) {
          return { error: 'No puede publicar temas fuera de su sucursal', status: 403 } as const;
        }
        companyId = branch.companyId;
      }

      if (!isSameCompanyScope(theme.companyId, companyId)) {
        return { error: 'Este tema está asignado a otra empresa. Clónelo para reutilizar el diseño.', status: 409 } as const;
      }
      const crossCompany = {
        OR: [{ companyId: null }, { companyId: { not: companyId } }],
      };
      const [foreignCompanies, foreignBranches, foreignRoleRules] = await Promise.all([
        tx.company.count({
          where: {
            id: { not: companyId },
            OR: [{ defaultVcardThemeId: themeId }, { seasonalVcardThemeId: themeId }],
          },
        }),
        tx.branch.count({
          where: {
            AND: [
              crossCompany,
              { OR: [{ vcardThemeId: themeId }, { seasonalVcardThemeId: themeId }, { themeId }] },
            ],
          },
        }),
        tx.vCardPositionThemeRule.count({
          where: {
            themeId,
            branch: {
              OR: [{ companyId: null }, { companyId: { not: companyId } }],
            },
          },
        }),
      ]);
      if (foreignCompanies || foreignBranches || foreignRoleRules) {
        return { error: 'Este tema ya se usa fuera de la empresa elegida. Clone el tema antes de publicarlo.', status: 409 } as const;
      }

      // Do not deactivate other themes or update unrelated branches.
      await tx.theme.update({ where: { id: themeId }, data: { isActive: true, companyId } });
      const seasonal = themeSlot(theme.type) === 'seasonal';
      if (scope === 'company') {
        await tx.company.update({
          where: { id: targetId },
          data: seasonal ? { seasonalVcardThemeId: themeId } : { defaultVcardThemeId: themeId },
        });
      } else {
        await tx.branch.update({
          where: { id: targetId },
          data: seasonal ? { seasonalVcardThemeId: themeId } : { vcardThemeId: themeId },
        });
      }
      return { success: true, themeId, scope, targetId } as const;
    }, { isolationLevel: 'Serializable' });

    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error publishing vCard theme:', error);
    return NextResponse.json({ error: 'No se pudo publicar. Revise conflictos concurrentes y vuelva a intentar.' }, { status: 409 });
  }
}
