// Seed: Tema YUDE Canahuati Ford para vCard corporativa
// Ejecutar: node scripts/seed-yude-ford-theme.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BRAND_BLUE = '#003478';
const BRAND_WHITE = '#ffffff';

// Layout pixel-perfect basado en la imagen de referencia YUDE Ford
const yudeLayout = [
  {
    id: 'yude-header',
    type: 'Header',
    props: {
      bgColor: BRAND_BLUE,
      textColor: BRAND_WHITE,
      title: 'YUDE Canahuati SA de CV',
      subtitle: 'VCARD CORPORATIVA',
      logoUrl: null,          // usa el logoUrl de la sucursal/empresa configurado
      logoHeight: 52,
      logoWidth: null,
      logoAlign: 'center',
    },
  },
  {
    id: 'yude-profile',
    type: 'Profile',
    props: {
      usePhoto: true,
      avatarSize: 104,
      avatarBg: BRAND_BLUE,
      avatarText: 'YC',
      align: 'center',
      nameColor: '#111827',
      nameSize: 22,
      showCompany: true,
    },
  },
  {
    id: 'yude-contact-actions',
    type: 'ContactActions',
    props: {
      buttonRadius: 14,
      buttonPadding: 14,
      iconSize: 22,
      showBorder: true,
      itemBorderColor: '#e5e7eb',
      sectionBgColor: '#ffffff',
      items: [
        {
          id: 'ca-llamar',
          type: 'tel',
          label: 'LLAMAR',
          bgColor: '#ffffff',
          textColor: '#374151',
        },
        {
          id: 'ca-whatsapp',
          type: 'wa',
          label: 'WHATSAPP',
          bgColor: '#ffffff',
          textColor: '#25D366',
        },
        {
          id: 'ca-email',
          type: 'email',
          label: 'EMAIL',
          bgColor: '#ffffff',
          textColor: '#374151',
        },
      ],
    },
  },
  {
    id: 'yude-btn-row',
    type: 'ButtonRow',
    props: {
      gap: 10,
      paddingY: 2,
      buttons: [
        {
          id: 'btn-agenda',
          label: 'Agenda tu cita hoy !',
          bgColor: BRAND_BLUE,
          textColor: BRAND_WHITE,
          iconEmoji: '📅',
          borderRadius: 12,
          actionType: 'url',
          actionUrl: 'https://www.yudecanahuati.com/citas',
        },
        {
          id: 'btn-consulta',
          label: 'Consulta el estado de tu vehículo.',
          bgColor: '#ffffff',
          textColor: BRAND_BLUE,
          iconEmoji: '🔍',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#d1d5db',
          actionType: 'url',
          actionUrl: 'https://www.yudecanahuati.com/estado-vehiculo',
        },
      ],
    },
  },
  {
    id: 'yude-save-contact',
    type: 'ActionButton',
    props: {
      label: 'Guardar en Contactos (vCard)',
      bgColor: BRAND_BLUE,
      textColor: BRAND_WHITE,
      borderRadius: 12,
    },
  },
  {
    id: 'yude-map',
    type: 'MapBlock',
    props: {
      mapEmbedUrl:
        'https://maps.google.com/maps?q=Ford+Yude+Canahuati+San+Pedro+Sula+Honduras&output=embed&hl=es',
      mapHeight: 175,
      title: 'Nuestra Ubicación',
      subtitle: 'Contacto digital corporativo',
      buttonLabel: 'Ver en Google Maps',
      mapsUrl:
        'https://www.google.com/maps/search/Ford+Yude+Canahuati+San+Pedro+Sula+Honduras',
    },
  },
  {
    id: 'yude-footer',
    type: 'Footer',
    props: {
      bgColor: '#f8fafc',
      textColor: '#6b7280',
      title: '© 2026 YUDE CANAHUATI SA DE CV - Todos los derechos reservados',
      subtitle: 'Honduras',
      showLegal: false,
      paddingY: 24,
    },
  },
];

async function main() {
  const themeName = 'vCard YUDE Ford Corporativo';

  const existing = await prisma.theme.findFirst({
    where: { name: themeName, category: 'VCARD' },
  });

  let theme;
  if (existing) {
    theme = await prisma.theme.update({
      where: { id: existing.id },
      data: {
        colors: JSON.stringify({ primary: BRAND_BLUE, secondary: BRAND_WHITE, accent: '#1d4ed8' }),
        config: yudeLayout,
        type: 'CORPORATE',
      },
    });
    console.log(`✅ Tema actualizado: "${themeName}" → id=${theme.id}`);
  } else {
    theme = await prisma.theme.create({
      data: {
        name: themeName,
        category: 'VCARD',
        type: 'CORPORATE',
        colors: JSON.stringify({ primary: BRAND_BLUE, secondary: BRAND_WHITE, accent: '#1d4ed8' }),
        config: yudeLayout,
        isActive: true,
      },
    });
    console.log(`✅ Tema creado: "${themeName}" → id=${theme.id}`);
  }

  // Asignar como tema default a las compañías YUDE / Ford Canahuati
  const companyMatches = await prisma.company.findMany({
    where: {
      OR: [
        { name: { contains: 'Canahuati', mode: 'insensitive' } },
        { name: { contains: 'Ford', mode: 'insensitive' } },
        { name: { contains: 'YUDE', mode: 'insensitive' } },
      ],
    },
  });

  if (companyMatches.length === 0) {
    console.log('ℹ️  No se encontraron compañías YUDE/Ford. Asignando tema a todas las compañías sin tema...');
    const allCompanies = await prisma.company.findMany({ where: { defaultVcardThemeId: null } });
    for (const co of allCompanies) {
      await prisma.company.update({ where: { id: co.id }, data: { defaultVcardThemeId: theme.id } });
      console.log(`   → Compañía "${co.name}" → tema por defecto asignado`);
    }
  } else {
    for (const co of companyMatches) {
      await prisma.company.update({ where: { id: co.id }, data: { defaultVcardThemeId: theme.id } });
      console.log(`   → Compañía "${co.name}" → tema YUDE Ford asignado como default`);
    }
  }

  // Asignar tema a todas las sucursales que no tienen tema
  const branches = await prisma.branch.findMany({ where: { vcardThemeId: null } });
  for (const br of branches) {
    await prisma.branch.update({ where: { id: br.id }, data: { vcardThemeId: theme.id } });
    console.log(`   → Sucursal "${br.name}" → tema YUDE Ford asignado`);
  }

  // También, si hay sucursales con nombre Ford/YUDE ya con tema, actualizar
  const yudeBranches = await prisma.branch.findMany({
    where: {
      OR: [
        { name: { contains: 'Ford', mode: 'insensitive' } },
        { name: { contains: 'YUDE', mode: 'insensitive' } },
        { name: { contains: 'Canahuati', mode: 'insensitive' } },
        { companyName: { contains: 'Ford', mode: 'insensitive' } },
        { companyName: { contains: 'YUDE', mode: 'insensitive' } },
        { companyName: { contains: 'Canahuati', mode: 'insensitive' } },
      ],
    },
  });
  for (const br of yudeBranches) {
    await prisma.branch.update({ where: { id: br.id }, data: { vcardThemeId: theme.id } });
    console.log(`   → Sucursal YUDE/Ford "${br.name}" → tema forzado`);
  }

  console.log('\n🎉 Seed YUDE Ford completado!');
  console.log(`   Tema id: ${theme.id}`);
  console.log('   Para asignar manualmente a una sucursal:');
  console.log(`   UPDATE "Branch" SET "vcardThemeId" = '${theme.id}' WHERE name ILIKE '%ford%';`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
