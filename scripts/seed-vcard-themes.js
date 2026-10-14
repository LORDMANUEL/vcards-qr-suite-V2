const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function createTheme(name, colors, season = 'summer') {
  return {
    name,
    category: 'VCARD',
    type: ['summer', 'winter', 'rainy', 'autumn', 'halloween'].includes(season) ? 'SEASONAL' : 'CORPORATE',
    colors: JSON.stringify(colors),
    config: [
      { id: `${name}-season`, type: 'SeasonalHero', props: { season, headline: season === 'summer' ? 'Ford rumbo a la playa' : season === 'halloween' ? 'Temporada Halloween Ford' : 'Experiencia ejecutiva digital', subheadline: season === 'halloween' ? 'Detalles animados premium con aranias y ambiente nocturno.' : 'Animacion estacional y presentacion premium de contacto.', primaryColor: colors.primary, accentColor: colors.accent } },
      { id: `${name}-header`, type: 'Header', props: { bgColor: colors.primary, textColor: '#ffffff', title: 'Ford Yude Canahuati', subtitle: 'vCard Experience', logoUrl: '' } },
      { id: `${name}-profile`, type: 'Profile', props: { avatarBg: colors.primary, avatarText: 'FY', avatarUrl: '', usePhoto: true, textColor: '#111827', nameColor: colors.primary, showCompany: true } },
      { id: `${name}-stats`, type: 'StatsBar', props: { highlightColor: colors.accent, items: [{ id: 's1', label: 'Sucursal', value: 'Multisede' }, { id: 's2', label: 'Marca', value: 'Activa' }, { id: 's3', label: 'Temporada', value: season === 'summer' ? 'Verano' : 'Premium' }] } },
      { id: `${name}-actions`, type: 'ContactActions', props: { items: [{ id: 'a1', type: 'tel', label: 'Llamar', bgColor: colors.primary, textColor: '#ffffff' }, { id: 'a2', type: 'wa', label: 'WhatsApp', bgColor: '#25d366', textColor: '#ffffff' }, { id: 'a3', type: 'email', label: 'Email', bgColor: colors.accent, textColor: '#ffffff' }, { id: 'a4', type: 'link', label: 'Sitio', bgColor: '#ffffff', textColor: colors.primary, href: 'https://www.yudecanahuati.com' }] } },
      { id: `${name}-promo`, type: 'PromoStrip', props: { title: 'Temporada activa', items: [{ id: 'p1', title: 'Promocion Ford', description: 'Descubre beneficios y agenda tu visita.' }, { id: 'p2', title: 'Atencion digital', description: 'Comparte la vCard y descarga el contacto.' }] } },
      { id: `${name}-info`, type: 'ContactInfo', props: { bgColor: '#f8fafc', iconBg: colors.primary, iconColor: '#ffffff', items: [{ id: 'i1', label: 'Email', value: 'asesor@fordhn.com', icon: 'email' }, { id: 'i2', label: 'Telefono', value: '+504 2550-0001', icon: 'phone' }, { id: 'i3', label: 'Sitio Web', value: 'www.yudecanahuati.com', icon: 'web' }] } },
      { id: `${name}-cta`, type: 'ActionButton', props: { label: 'Descargar Contacto', bgColor: colors.primary, textColor: '#ffffff', borderRadius: '16' } },
      { id: `${name}-footer`, type: 'Footer', props: { title: 'Ford Yude Canahuati', subtitle: 'Contacto digital verificado', legalText: '© Ford Yude Canahuati - Todos los derechos reservados', bgColor: '#0f172a', textColor: '#ffffff', showLegal: true } },
    ],
  };
}

async function main() {
  const presets = [
    createTheme('vCard Verano Playa', { primary: '#0f172a', secondary: '#ffffff', accent: '#38bdf8' }, 'summer'),
    createTheme('vCard Ejecutivo Premium', { primary: '#1f2937', secondary: '#ffffff', accent: '#f59e0b' }, 'executive'),
    createTheme('vCard Servicio Posventa', { primary: '#003478', secondary: '#ffffff', accent: '#10b981' }, 'service'),
    createTheme('vCard Invierno Corporativo', { primary: '#0f172a', secondary: '#ffffff', accent: '#93c5fd' }, 'winter'),
    createTheme('vCard Lluvia Urbana', { primary: '#1e293b', secondary: '#ffffff', accent: '#06b6d4' }, 'rainy'),
    createTheme('vCard Halloween Noir', { primary: '#111827', secondary: '#ffffff', accent: '#f97316' }, 'halloween'),
  ];

  for (const preset of presets) {
    const existing = await prisma.theme.findFirst({ where: { name: preset.name, category: 'VCARD' } });
    if (existing) {
      await prisma.theme.update({ where: { id: existing.id }, data: { colors: preset.colors, config: preset.config, type: preset.type } });
    } else {
      await prisma.theme.create({ data: { ...preset, isActive: false } });
    }
  }

  const branches = await prisma.branch.findMany({ orderBy: { createdAt: 'asc' } });
  for (const branch of branches) {
    const company = await prisma.company.upsert({
      where: { name: branch.companyName || 'Ford Yude Canahuati' },
      update: {},
      create: { name: branch.companyName || 'Ford Yude Canahuati', slug: (branch.companyName || 'Ford Yude Canahuati').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') },
    });
    await prisma.branch.update({ where: { id: branch.id }, data: { companyId: company.id } });
  }

  const companies = await prisma.company.findMany();
  const summerTheme = await prisma.theme.findFirst({ where: { name: 'vCard Verano Playa', category: 'VCARD' } });
  const serviceTheme = await prisma.theme.findFirst({ where: { name: 'vCard Servicio Posventa', category: 'VCARD' } });
  for (const company of companies) {
    await prisma.company.update({
      where: { id: company.id },
      data: {
        defaultVcardThemeId: company.defaultVcardThemeId || serviceTheme?.id || null,
        seasonalVcardThemeId: company.seasonalVcardThemeId || summerTheme?.id || null,
      },
    });
  }

  for (const branch of branches) {
    await prisma.branch.update({
      where: { id: branch.id },
      data: {
        companyName: branch.companyName || 'Ford Yude Canahuati',
        vcardThemeId: branch.vcardThemeId || serviceTheme?.id || null,
        seasonalVcardThemeId: branch.seasonalVcardThemeId || summerTheme?.id || null,
      },
    });
  }

  const companiesWithBranches = await prisma.company.findMany({ include: { branches: { orderBy: { createdAt: 'asc' } } } });
  for (const company of companiesWithBranches) {
    for (const [index, branch] of company.branches.entries()) {
      await prisma.branch.update({ where: { id: branch.id }, data: { sortOrder: index } });
    }
  }

  console.log(`Seeded ${presets.length} vCard themes for ${branches.length} branches.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
