const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const defaultThemeConfig = {
  portalConfig: {
    bgColor: '#eff6ff',
    primaryColor: '#003478',
    accentColor: '#2563eb',
    textColor: '#111827',
    logoUrl: '',
    bgImageUrl: '',
    bgBlur: 0,
    bgOpacity: 75,
    welcomeTitle: 'Conectate a nuestra red de invitados',
    welcomeSubtitle: 'Completa tus datos para habilitar internet en este dispositivo.',
    buttonText: 'Conectar ahora',
    buttonColor: '#2563eb',
    showTimer: false,
    timerText: 'Tiempo restante',
    cardRadius: 28,
    bgGradient: true,
    gradientTo: '#0f172a',
    showFieldName: true,
    showFieldEmail: true,
    showFieldPhone: true,
    showFieldVehicle: false,
  },
  garantizadoConfig: {
    bgColor: '#ecfdf5',
    primaryColor: '#003478',
    accentColor: '#10b981',
    textColor: '#111827',
    logoUrl: '',
    bgImageUrl: '',
    bgBlur: 0,
    bgOpacity: 75,
    welcomeTitle: 'Acceso garantizado activo',
    welcomeSubtitle: 'Tu dispositivo ya tiene acceso temporal a internet.',
    buttonText: 'Actualizar estado',
    buttonColor: '#10b981',
    showTimer: true,
    timerText: 'Tiempo restante',
    cardRadius: 28,
    bgGradient: true,
    gradientTo: '#052e2b',
    showFieldName: true,
    showFieldEmail: true,
    showFieldPhone: true,
    showFieldVehicle: false,
  },
  internetConfig: {
    bgColor: '#f3f7fb',
    primaryColor: '#003478',
    accentColor: '#0f766e',
    textColor: '#111827',
    logoUrl: '',
    bgImageUrl: '',
    bgBlur: 0,
    bgOpacity: 75,
    welcomeTitle: 'Estado de internet disponible',
    welcomeSubtitle: 'Consulta el estado de la sesion y la conectividad del punto de acceso.',
    buttonText: 'Verificar conexion',
    buttonColor: '#0f766e',
    showTimer: false,
    timerText: 'Tiempo restante',
    cardRadius: 28,
    bgGradient: true,
    gradientTo: '#0f172a',
    showFieldName: true,
    showFieldEmail: true,
    showFieldPhone: true,
    showFieldVehicle: false,
  },
};

const themePresets = [
  {
    name: 'Portal Corporativo Base',
    colors: { primary: '#003478', secondary: '#eff6ff', accent: '#2563eb' },
    config: defaultThemeConfig,
    isActive: true,
  },
  {
    name: 'Portal Servicio Premium',
    colors: { primary: '#1f2937', secondary: '#fff7ed', accent: '#f97316' },
    config: {
      portalConfig: { ...defaultThemeConfig.portalConfig, bgColor: '#fff7ed', primaryColor: '#1f2937', accentColor: '#f97316', buttonColor: '#ea580c', welcomeTitle: 'Bienvenido al lounge de servicio', showFieldVehicle: true, showFieldVehicleYear: true, showFieldLicensePlate: true, featureChips: ['Servicio premium', 'Atencion inmediata', 'WiFi clientes'] },
      garantizadoConfig: { ...defaultThemeConfig.garantizadoConfig, bgColor: '#fff7ed', primaryColor: '#1f2937', accentColor: '#f97316', buttonColor: '#ea580c', featureChips: ['Acceso premium', 'Tiempo visible', 'Soporte activo'] },
      internetConfig: { ...defaultThemeConfig.internetConfig, bgColor: '#fff7ed', primaryColor: '#1f2937', accentColor: '#c2410c', buttonColor: '#c2410c', featureChips: ['Promociones', 'Links rapidos', 'Estado de red'] },
    },
  },
  {
    name: 'Portal Nocturno Ejecutivo',
    colors: { primary: '#e2e8f0', secondary: '#0f172a', accent: '#06b6d4' },
    config: {
      portalConfig: { ...defaultThemeConfig.portalConfig, bgColor: '#0f172a', gradientTo: '#020617', primaryColor: '#e2e8f0', textColor: '#e2e8f0', accentColor: '#06b6d4', buttonColor: '#0891b2', showFieldRtn: true, showFieldVin: true, featureChips: ['Portal ejecutivo', 'Integracion AP', 'Captura avanzada'] },
      garantizadoConfig: { ...defaultThemeConfig.garantizadoConfig, bgColor: '#0f172a', gradientTo: '#022c22', primaryColor: '#e2e8f0', textColor: '#e2e8f0', accentColor: '#34d399', buttonColor: '#059669', featureChips: ['Autorizado', 'Sesion activa', 'Router sync'] },
      internetConfig: { ...defaultThemeConfig.internetConfig, bgColor: '#020617', gradientTo: '#0f172a', primaryColor: '#e2e8f0', textColor: '#e2e8f0', accentColor: '#22d3ee', buttonColor: '#0891b2', featureChips: ['Banners', 'Promociones', 'Diagnostico'] },
    },
  },
];

async function main() {
  const branches = await prisma.branch.findMany({
    select: { id: true, name: true, portalThemeId: true },
    orderBy: { createdAt: 'asc' },
  });

  let baseThemeId = null;
  for (const preset of themePresets) {
    const theme = await prisma.theme.upsert({
      where: { id: (await prisma.theme.findFirst({ where: { name: preset.name, category: 'PORTAL' }, select: { id: true } }))?.id || 'missing-id-that-will-create' },
      update: {
        colors: JSON.stringify(preset.colors),
        config: preset.config,
        isActive: preset.isActive ?? false,
        category: 'PORTAL',
        type: 'CORPORATE',
        typography: 'Inter',
      },
      create: {
        name: preset.name,
        category: 'PORTAL',
        type: 'CORPORATE',
        colors: JSON.stringify(preset.colors),
        typography: 'Inter',
        config: preset.config,
        isActive: preset.isActive ?? false,
      },
    });
    if (!baseThemeId && preset.isActive) {
      baseThemeId = theme.id;
    }
  }

  for (const branch of branches) {
    if (!branch.portalThemeId) {
      await prisma.branch.update({
        where: { id: branch.id },
        data: { portalThemeId: baseThemeId },
      });
    }

    const identifier = `${branch.name}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    await prisma.accessPoint.upsert({
      where: { identifier },
      update: {
        branchId: branch.id,
        themeId: baseThemeId,
        providerType: 'CUDY',
        timeLimit: 120,
        timerVisible: true,
        isActive: true,
        fields: ['collectName', 'collectEmail', 'collectPhone'],
      },
      create: {
        name: `${branch.name} AP Principal`,
        identifier,
        providerType: 'CUDY',
        branchId: branch.id,
        themeId: baseThemeId,
        timeLimit: 120,
        timerVisible: true,
        isActive: true,
        fields: ['collectName', 'collectEmail', 'collectPhone'],
      },
    });
  }

  const bannerCount = await prisma.banner.count();
  if (bannerCount === 0) {
    await prisma.banner.createMany({
      data: [
        { name: 'Banner Servicios', imageUrl: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80', targetUrl: 'https://fordyudecanahuati.com', isActive: true },
        { name: 'Banner Mantenimiento', imageUrl: 'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?auto=format&fit=crop&w=1200&q=80', targetUrl: 'https://fordyudecanahuati.com/servicios', isActive: true },
      ],
    });
  }

  const promoCount = await prisma.promotion.count();
  if (promoCount === 0) {
    await prisma.promotion.createMany({
      data: [
        { title: 'Cambio de aceite con descuento', description: 'Agenda hoy y recibe beneficio en servicio rapido.', imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80', targetUrl: 'https://fordyudecanahuati.com/ofertas', isActive: true },
        { title: 'Accesorios y repuestos', description: 'Consulta promociones activas para clientes en sala.', imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80', targetUrl: 'https://fordyudecanahuati.com/repuestos', isActive: true },
      ],
    });
  }

  const linkCount = await prisma.captivePortalLink.count();
  if (linkCount === 0) {
    await prisma.captivePortalLink.createMany({
      data: [
        { name: 'Agenda de servicio', url: 'https://fordyudecanahuati.com/citas', isActive: true },
        { name: 'Catalogo Ford', url: 'https://fordyudecanahuati.com/catalogo', isActive: true },
        { name: 'WhatsApp sucursal', url: 'https://wa.me/50499999999', isActive: true },
      ],
    });
  }

  console.log(`Portal defaults ready. Branches: ${branches.length}, themes: ${themePresets.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
