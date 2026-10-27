import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { explicitCompanyBranches } from '@/lib/company-onboarding';
import { isUnusedCompanyTheme } from '@/lib/company-theme-policy';

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function ensureCompanyDefaultTheme(tx: any, body: any) {
  if (body.defaultVcardThemeId) return body.defaultVcardThemeId;

  const themeName = `${body.name} Corporativo`;
  const colors = JSON.stringify({ primary: body.primaryColor || '#003478', secondary: body.secondaryColor || '#FFFFFF', accent: '#10B981' });
  // Do not reuse a theme by display name across companies. Each new
  // company's draft must have an independent ID to prevent cross-brand edits.
  const createdTheme = await tx.theme.create({
    data: {
      name: themeName,
      category: 'VCARD',
      type: 'CORPORATE',
      colors,
      isActive: false,
      config: [
        { id: `${themeName}-header`, type: 'Header', props: { bgColor: body.primaryColor || '#003478', textColor: '#ffffff', title: body.name, subtitle: 'vCard corporativa', logoUrl: body.logoUrl || '' } },
        { id: `${themeName}-profile`, type: 'Profile', props: { avatarBg: body.primaryColor || '#003478', avatarText: 'VC', avatarUrl: '', usePhoto: true, textColor: '#111827', nameColor: body.primaryColor || '#003478', showCompany: true } },
        { id: `${themeName}-actions`, type: 'ContactActions', props: { items: [{ id: 'tel', type: 'tel', label: 'Llamar', bgColor: body.primaryColor || '#003478', textColor: '#ffffff' }, { id: 'wa', type: 'wa', label: 'WhatsApp', bgColor: '#25d366', textColor: '#ffffff' }, { id: 'email', type: 'email', label: 'Email', bgColor: '#ffffff', textColor: body.primaryColor || '#003478' }] } },
        { id: `${themeName}-cta`, type: 'ActionButton', props: { label: 'Descargar Contacto', bgColor: body.primaryColor || '#003478', textColor: '#ffffff', borderRadius: '16' } },
        { id: `${themeName}-footer`, type: 'Footer', props: { title: body.name, subtitle: 'Contacto digital corporativo', legalText: `© ${body.name}`, bgColor: '#0f172a', textColor: '#ffffff', showLegal: true } },
      ],
    },
    select: { id: true },
  });

  return createdTheme.id;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const companies = await prisma.company.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      defaultVcardTheme: { select: { id: true, name: true } },
      seasonalVcardTheme: { select: { id: true, name: true } },
      branches: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          name: true,
          city: true,
          sortOrder: true,
          vcardThemeId: true,
          seasonalVcardThemeId: true,
        },
      },
      _count: { select: { branches: true } },
    },
  });

  return NextResponse.json({ companies });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['ADMIN', 'IT', 'SUPER_ADMIN'].includes(String(session.user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name) return NextResponse.json({ error: 'El nombre de la empresa es obligatorio' }, { status: 400 });

  // Explicit branches only; never synthesize the first branch from Company.name.
  let branchesToCreate: ReturnType<typeof explicitCompanyBranches>;
  try {
    branchesToCreate = explicitCompanyBranches(body?.branches, name);
  } catch {
    return NextResponse.json({ error: 'Hay sucursales duplicadas o identificadores inválidos' }, { status: 422 });
  }

  const existing = await prisma.company.findFirst({ where: { name: { equals: name, mode: 'insensitive' } }, select: { id: true } });
  if (existing) return NextResponse.json({ error: 'Ya existe una empresa con ese nombre. Edítela o vincule sus sucursales existentes.' }, { status: 409 });

  try {
    const company = await prisma.$transaction(async (tx) => {
    // References to existing themes are legal only when unused and unowned.
    // Themes in another company's published cards must first be cloned.
    const themeIds = [body.defaultVcardThemeId, body.seasonalVcardThemeId]
      .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0);
    if (themeIds.length) {
      const unique = [...new Set(themeIds)];
      const [themes, assignments, branchAssignments] = await Promise.all([
        tx.theme.findMany({ where: { id: { in: unique } }, select: { id: true, category: true, companyId: true } }),
        tx.company.count({ where: { OR: [
          { defaultVcardThemeId: { in: unique } }, { seasonalVcardThemeId: { in: unique } },
        ] } }),
        tx.branch.count({ where: { OR: [
          { vcardThemeId: { in: unique } }, { seasonalVcardThemeId: { in: unique } },
          { themeId: { in: unique } },
        ] } }),
      ]);
      if (!isUnusedCompanyTheme(themes, unique, assignments, branchAssignments)) {
        throw new Error('THEME_NOT_AVAILABLE');
      }
    }
    const defaultThemeId = await ensureCompanyDefaultTheme(tx, body);
    const created = await tx.company.create({
      data: {
        name,
        slug: body.slug || slugify(name),
        logoUrl: body.logoUrl || null,
        primaryColor: body.primaryColor || '#003478',
        secondaryColor: body.secondaryColor || '#FFFFFF',
        defaultVcardThemeId: defaultThemeId,
        seasonalVcardThemeId: body.seasonalVcardThemeId || null,
      },
    });

    // Do not insert an implicit Company-as-Branch record.
    // Existing branches are reconciled by ID in the company management UI.
    const extraBranches = branchesToCreate;
    if (extraBranches.length) {
      await tx.branch.createMany({
        data: extraBranches.map((branch, index) => ({
          companyId: created.id,
          companyName: created.name,
          name: branch.name,
          city: branch.city,
          address: branch.address,
          country: branch.country,
          uniqueSlug: branch.uniqueSlug,
          primaryColor: created.primaryColor,
          secondaryColor: created.secondaryColor,
          logoUrl: created.logoUrl,
          vcardThemeId: created.defaultVcardThemeId,
          seasonalVcardThemeId: created.seasonalVcardThemeId,
          sortOrder: index,
        })),
      });
    }

    return created;
    });

    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'THEME_NOT_AVAILABLE') {
      return NextResponse.json({ error: 'Un tema ya pertenece a otra compañía o está publicado. Cree un borrador/clon independiente.' }, { status: 422 });
    }
    console.error('Error creating company:', error);
    return NextResponse.json({ error: 'No se pudo crear la empresa. Revise nombre, slug y sucursales duplicadas.' }, { status: 409 });
  }
}