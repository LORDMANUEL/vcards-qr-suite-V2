import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canManageCompanies, canBulkImportVcards } from '@/lib/permissions';
import { canEditCard } from '@/lib/vcard-edit-policy';
import { branchBelongsToCompany } from '@/lib/branch-integrity';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const role = String(session.user.role);
    const canManageAny = canManageCompanies(role);
    if (!canManageAny && !canBulkImportVcards(role)) return NextResponse.json({ error: 'Sin permisos de edición' }, { status: 403 });

    const body = await request.json();
    const { name, position, email, phone, website, photoUrl, branchId, companyId } = body;

    if (!name || !email || !branchId) {
      return NextResponse.json(
        { error: 'Nombre, email y sucursal son requeridos' },
        { status: 400 }
      );
    }

    const vcard = await prisma.vCard.findUnique({
      where: { id: params.id },
      include: { user: { include: { _count: { select: { vcards: true } } } }, branch: true },
    });

    if (!vcard) {
      return NextResponse.json(
        { error: 'vCard no encontrada' },
        { status: 404 }
      );
    }

    const policy = canEditCard({
      cardActive: vcard.isActive,
      userActive: vcard.user.isActive,
      userCards: vcard.user._count.vcards,
      admin: canManageAny,
      sameBranch: session.user.branchId === branchId && session.user.branchId === vcard.branchId,
    });
    if (policy !== 'ok') return NextResponse.json({ error: policy === 'archived' ? 'Restaure la tarjeta antes de editarla' : policy === 'shared' ? 'La cuenta tiene varias vCards: edite el perfil compartido con un procedimiento específico' : 'Operación no autorizada' }, { status: policy === 'denied' ? 403 : 409 });

    const selectedBranch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!selectedBranch) {
      return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 });
    }
    if (!selectedBranch.companyId || !branchBelongsToCompany(selectedBranch, companyId)) {
      return NextResponse.json({ error: 'La sucursal no pertenece a la empresa indicada. Revise la vinculación de empresas y sucursales.' }, { status: 422 });
    }

    // Updating User and vCard must be atomic.
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
      where: { id: vcard.userId },
      data: {
        name,
        position,
        email,
        phone,
        photoUrl,
        website,
        branchId,
      },
    });

    // Keep vCard tied to the selected existing branch.
      const changed = await tx.vCard.updateMany({
        where: { id: params.id, isActive: true, user: { isActive: true } },
        data: { branchId: selectedBranch.id },
      });
      if (changed.count !== 1) throw new Error('VCARD_EDIT_CONFLICT');
    });

    const updatedVCard = await prisma.vCard.findUnique({
      where: { id: params.id },
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
            city: true,
            companyId: true,
            companyName: true,
            name: true,
            address: true,
          },
        },
      },
    });

    return NextResponse.json({ vcard: updatedVCard });
  } catch (error) {
    if (error instanceof Error && error.message === 'VCARD_EDIT_CONFLICT') {
      return NextResponse.json({ error: 'La tarjeta se archivó o desactivó durante la edición. Recargue los datos.' }, { status: 409 });
    }
    console.error('Error updating vCard:', error);
    return NextResponse.json(
      { error: 'Error al actualizar vCard' },
      { status: 500 }
    );
  }
}

/**
 * Archive is reversible. Never delete the VCard row or cascade-delete Scan
 * history: its qrCodeData, signed QR image and reports are historical records.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!canManageCompanies(String(session.user.role))) {
      return NextResponse.json({ error: 'Sin permiso para archivar vCards' }, { status: 403 });
    }

    const result = await prisma.vCard.updateMany({
      where: { id: params.id, isActive: true },
      data: { isActive: false },
    });
    if (result.count === 0) {
      const existing = await prisma.vCard.findUnique({
        where: { id: params.id }, select: { id: true, isActive: true },
      });
      if (!existing) return NextResponse.json({ error: 'vCard no encontrada' }, { status: 404 });
      return NextResponse.json({ archived: true, alreadyArchived: true, id: params.id });
    }

    return NextResponse.json({
      archived: true,
      id: params.id,
      message: 'vCard archivada. El QR anterior queda deshabilitado; escaneos y métricas se conservaron.',
    });
  } catch (error) {
    console.error('Error archivando vCard:', error);
    return NextResponse.json({ error: 'No se pudo archivar la vCard' }, { status: 500 });
  }
}

/** Restore existing signed QR without generating another URL or deleting stats. */
export async function PATCH(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!canManageCompanies(String(session.user.role))) {
      return NextResponse.json({ error: 'Sin permiso para restaurar vCards' }, { status: 403 });
    }

    const existing = await prisma.vCard.findUnique({
      where: { id: params.id },
      select: { id: true, isActive: true, qrCodeData: true, user: { select: { isActive: true } } },
    });
    if (!existing) return NextResponse.json({ error: 'vCard no encontrada' }, { status: 404 });
    if (!existing.user.isActive) {
      return NextResponse.json({ error: 'El usuario está inactivo. Reactívelo con autorización antes de restaurar su tarjeta.' }, { status: 409 });
    }
    if (existing.isActive) return NextResponse.json({ restored: true, alreadyActive: true, id: params.id });
    const result = await prisma.vCard.updateMany({
      where: { id: params.id, isActive: false },
      data: { isActive: true },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: 'La vCard cambió durante la restauración. Recargue la página.' }, { status: 409 });
    }
    return NextResponse.json({
      restored: true,
      id: params.id,
      message: 'vCard restaurada con su mismo QR y con el historial original.',
    });
  } catch (error) {
    console.error('Error restaurando vCard:', error);
    return NextResponse.json({ error: 'No se pudo restaurar la vCard' }, { status: 500 });
  }
}
