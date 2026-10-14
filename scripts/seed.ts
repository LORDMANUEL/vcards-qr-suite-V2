import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateQRCode } from '../lib/qr-generator';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create branches
  const branch1 = await prisma.branch.upsert({
    where: { id: 'branch-1' },
    update: {},
    create: {
      id: 'branch-1',
      name: 'Ford Yude Canahuati',
      address: 'Blvd. Los Proceres, San Pedro Sula, Honduras',
      city: 'San Pedro Sula',
      country: 'Honduras',
      primaryColor: '#003478',
      secondaryColor: '#FFFFFF',
    },
  });

  const branch2 = await prisma.branch.upsert({
    where: { id: 'branch-2' },
    update: {},
    create: {
      id: 'branch-2',
      name: 'Ford Yude Canahuati - Tegucigalpa',
      address: 'Blvd. Suyapa, Tegucigalpa, Honduras',
      city: 'Tegucigalpa',
      country: 'Honduras',
      primaryColor: '#003478',
      secondaryColor: '#FFFFFF',
    },
  });

  console.log('Branches created');

  // Create admin user
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'administrador@fordyudecanahuati.com' },
    update: {},
    create: {
      email: 'administrador@fordyudecanahuati.com',
      password: hashedAdminPassword,
      name: 'Administrador Ford Yude',
      role: 'SUPER_ADMIN',
      position: 'Administrador del Sistema',
      phone: '+504 2550-0000',
      branchId: branch1.id,
    },
  });

  console.log('Admin user created:', adminUser.email);

  // Create default test admin user (required)
  const hashedTestPassword = await bcrypt.hash('johndoe123', 10);
  const testUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      password: hashedTestPassword,
      name: 'John Doe',
      role: 'SUPER_ADMIN',
      position: 'Test Admin',
      phone: '+504 0000-0000',
      branchId: branch1.id,
    },
  });

  console.log('Test admin user created');

  // Create advisor users with vCards
  const advisors = [
    {
      email: 'juan.mendoza@ford.com.hn',
      name: 'Juan Carlos Mendoza',
      position: 'Asesor de Ventas Senior',
      phone: '+504 9999-1001',
      website: 'https://www.yudecanahuati.com',
      branchId: branch2.id,
    },
    {
      email: 'maria.rodriguez@ford.com.hn',
      name: 'Maria Elena Rodriguez',
      position: 'Gerente de Servicio',
      phone: '+504 9999-1002',
      website: 'https://www.yudecanahuati.com',
      branchId: branch1.id,
    },
    {
      email: 'roberto.sanchez@ford.com.hn',
      name: 'Roberto Sánchez',
      position: 'Especialista QuickLane',
      phone: '+504 9999-1003',
      website: 'https://quicklane.ford.com.hn',
      branchId: branch2.id,
    },
    {
      email: 'roberto.silva@fordyude.hn',
      name: 'Roberto Silva',
      position: 'Gerente de Ventas',
      phone: '+504 2550-0003',
      website: 'https://www.yudecanahuati.com',
      branchId: branch1.id,
    },
    {
      email: 'maria.gonzalez@fordyude.hn',
      name: 'María González',
      position: 'Especialista en Servicio',
      phone: '+504 2550-0002',
      website: 'https://www.yudecanahuati.com',
      branchId: branch1.id,
    },
    {
      email: 'carlos.martinez@fordyude.hn',
      name: 'Carlos Martínez',
      position: 'Asesor de Servicio',
      phone: '+504 2550-0001',
      website: 'https://www.yudecanahuati.com',
      branchId: branch1.id,
    },
  ];

  const hashedPassword = await bcrypt.hash('default123', 10);

  for (const advisorData of advisors) {
    const user = await prisma.user.upsert({
      where: { email: advisorData.email },
      update: {},
      create: {
        email: advisorData.email,
        password: hashedPassword,
        name: advisorData.name,
        role: 'ADVISOR',
        position: advisorData.position,
        phone: advisorData.phone,
        website: advisorData.website,
        branchId: advisorData.branchId,
      },
    });

    // Create vCard for advisor
    const existingVCard = await prisma.vCard.findFirst({
      where: { userId: user.id },
    });

    if (!existingVCard) {
      const qrCodeData = uuidv4();
      const publicUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/vcard/${qrCodeData}`;
      const qrImageUrl = await generateQRCode(publicUrl);

      await prisma.vCard.create({
        data: {
          userId: user.id,
          branchId: advisorData.branchId,
          qrCodeData,
          qrImageUrl,
          isActive: true,
          downloadCount: user.email === 'roberto.sanchez@ford.com.hn' ? 13 :
            user.email === 'maria.rodriguez@ford.com.hn' ? 10 : 0,
        },
      });

      console.log(`vCard created for ${user.name}`);
    }
  }

  // Create a default theme
  await prisma.theme.upsert({
    where: { id: 'theme-1' },
    update: {},
    create: {
      id: 'theme-1',
      name: 'Ford Corporate',
      type: 'CORPORATE',
      colors: JSON.stringify({
        primary: '#003478',
        secondary: '#FFFFFF',
        accent: '#10B981',
      }),
      isActive: true,
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
