
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const mapping = [
  {
    company: 'Yude Canahuati SA de CV',
    companySlug: 'yude-canahuati-sa-de-cv',
    cities: ['La Ceiba', 'San Pedro Sula', 'Tegucigalpa'],
  },
  {
    company: 'QuickLane',
    companySlug: 'quicklane',
    cities: ['La Ceiba', 'San Pedro Sula', 'Tegucigalpa'],
  },
  {
    company: 'Quicklane Truck',
    companySlug: 'quicklane-truck',
    cities: ['San Pedro Sula'],
  },
  {
    company: 'Gac',
    companySlug: 'gac',
    cities: ['San Pedro Sula'],
  },
];

const slugify = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function main() {
  let companiesCreated = 0;
  let companiesUpdated = 0;
  let branchesCreated = 0;
  let branchesUpdated = 0;

  for (const item of mapping) {
    const existingCompany = await prisma.company.findUnique({
      where: { name: item.company },
      select: { id: true },
    });

    const company = await prisma.company.upsert({
      where: { name: item.company },
      update: {},
      create: {
        name: item.company,
      },
    });

    if (existingCompany) {
      companiesUpdated += 1;
    } else {
      companiesCreated += 1;
    }

    for (const city of item.cities) {
      const uniqueSlug = `${item.companySlug}-${slugify(city)}`;
      const existingBranch = await prisma.branch.findUnique({
        where: { uniqueSlug },
        select: { id: true },
      });

      await prisma.branch.upsert({
        where: { uniqueSlug },
        update: {
          companyId: company.id,
          companyName: item.company,
          name: `${item.company} - ${city}`,
          city,
          country: 'Honduras',
        },
        create: {
          companyId: company.id,
          companyName: item.company,
          name: `${item.company} - ${city}`,
          city,
          country: 'Honduras',
          uniqueSlug,
        },
      });

      if (existingBranch) {
        branchesUpdated += 1;
      } else {
        branchesCreated += 1;
      }
    }
  }

  const result = {
    companiesCreated,
    companiesUpdated,
    branchesCreated,
    branchesUpdated,
  };

  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma[String.fromCharCode(36) + 'disconnect']();
  });
