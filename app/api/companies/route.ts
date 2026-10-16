import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { canManageCompanies, canViewVcards } from '@/lib/permissions';

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function normalizeBranches(branches: any[] | undefined, companyName: string) {
  if (!Array.isArray(branches)) return [];
  return branches
    .filter((branch) => branch?.city)
    .map((branch) => ({
      name: branch.name || `${companyName} - ${branch.city}`,
      city: branch.city,
      address: branch.address || null,
      country: branch.country || 'Honduras',
      uniqueSlug: branch.uniqueSlug || slugify(`${companyName}-${branch.city}`),
    }));
}

async function ensureCompanyDefaultTheme(tx: any, body: any) {
  if (body.defaultVcardThemeId) return body.defaultVcardThemeId;

  const themeName = `${body.name} Corporativo`;
  const colors = JSON.stringify({ primary: body.primaryColor || '#003478', secondary: body.secondaryColor || '#FFFFFF', accent: '#10B981' });
  const existing = await tx.theme.findFirst({ where: { name: themeName, category: 'VCARD' }, select: { id: true } });
  if (existing) return existing.id;

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
  const canManageAny = canManageCompanies(String(session.user.role));
  if (!canManageAny && !canViewVcards(String(session.user.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!canManageAny && !session.user.branchId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const companies = await prisma.company.findMany({
    where: canManageAny ? undefined : { branches: { some: { id: session.user.branchId! } } },
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
          address: true,
          country: true,
          uniqueSlug: true,
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

  const body = await req.json();
  const name = String(body?.name || '').trim();
  const slug = slugify(String(body?.slug || name));
  if (!name || !slug) {
    return NextResponse.json({ error: 'Nombre de empresa requerido' }, { status: 400 });
  }
  const existingCompany = await prisma.company.findFirst({
    where: { OR: [{ name }, { slug }] },
    select: { id: true },
  });
  if (existingCompany) {
    return NextResponse.json({ error: 'Ya existe una empresa con ese nombre o slug' }, { status: 409 });
  }

  body.name = name;
  body.slug = slug;
  const company = await prisma.$transaction(async (tx) => {
    const defaultThemeId = await ensureCompanyDefaultTheme(tx, body);
    const created = await tx.company.create({
      data: {
        name,
        slug,
        logoUrl: body.logoUrl || null,
        primaryColor: body.primaryColor || '#003478',
        secondaryColor: body.secondaryColor || '#FFFFFF',
        defaultVcardThemeId: defaultThemeId,
        seasonalVcardThemeId: body.seasonalVcardThemeId || null,
      },
    });

    await tx.branch.create({
      data: {
        companyId: created.id,
        companyName: created.name,
        name: body.baseBranchName || body.name,
        city: body.baseCity || body.city || null,
        address: body.baseAddress || body.address || null,
        country: body.country || 'Honduras',
        uniqueSlug: slugify(`${slug}-${body.baseCity || body.city || 'principal'}`),
        primaryColor: created.primaryColor,
        secondaryColor: created.secondaryColor,
        logoUrl: created.logoUrl,
        vcardThemeId: created.defaultVcardThemeId,
        seasonalVcardThemeId: created.seasonalVcardThemeId,
        sortOrder: 0,
      },
    });

    const extraBranches = normalizeBranches(body.branches, created.name);
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
          sortOrder: index + 1,
        })),
      });
    }

    return created;
  });

  return NextResponse.json({ company }, { status: 201 });
}
