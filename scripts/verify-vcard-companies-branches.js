
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const companies = [
  'Yude Canahuati SA de CV',
  'QuickLane',
  'Quicklane Truck',
  'Gac',
];

async function main() {
  const rows = await prisma.branch.findMany({
    where: { companyName: { in: companies } },
    select: { companyName: true, city: true, name: true, uniqueSlug: true },
    orderBy: [{ companyName: 'asc' }, { city: 'asc' }],
  });

  console.log(JSON.stringify(rows, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma[String.fromCharCode(36) + 'disconnect']();
  });
