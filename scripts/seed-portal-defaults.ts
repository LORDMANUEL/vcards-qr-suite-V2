import { PrismaClient } from '@prisma/client';

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

async function main() {
  const branches = await prisma.branch.findMany({
    select: { id: true, name: true, logoUrl: true, portalThemeId: true },
    orderBy: { createdAt: 'asc' },
  });

  const activeTheme = await prisma.theme.findFirst({
    where: { category: 'PORTAL', isActive: true },
  });

  const theme = activeTheme || await prisma.theme.create({
    data: {
      name: 'Portal Corporativo Base',
      category: 'PORTAL',
      type: 'CORPORATE',
      colors: JSON.stringify({ primary: '#003478', secondary: '#eff6ff', accent: '#2563eb' }),
      typography: 'Inter',
      config: defaultThemeConfig,
      isActive: true,
    },
  });

  for (const branch of branches) {
    if (!branch.portalThemeId) {
      await prisma.branch.update({
        where: { id: branch.id },
        data: { portalThemeId: theme.id },
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
        themeId: theme.id,
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
        themeId: theme.id,
        timeLimit: 120,
        timerVisible: true,
        isActive: true,
        fields: ['collectName', 'collectEmail', 'collectPhone'],
      },
    });
  }

  console.log(`Portal defaults ready. Branches: ${branches.length}, theme: ${theme.name}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
