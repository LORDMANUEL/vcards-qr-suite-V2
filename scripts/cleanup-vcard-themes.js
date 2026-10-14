const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const themes = await prisma.theme.findMany({
    where: { category: 'VCARD' },
    orderBy: [{ updatedAt: 'desc' }],
    select: { id: true, name: true, isActive: true, updatedAt: true },
  });

  const unnamed = themes.filter((theme) => !theme.name || !theme.name.trim());
  if (unnamed.length) {
    await prisma.theme.deleteMany({ where: { id: { in: unnamed.map((theme) => theme.id) } } });
  }

  const duplicates = new Map();
  const deleteIds = [];
  for (const theme of themes.filter((item) => item.name && item.name.trim())) {
    const key = theme.name.trim().toLowerCase();
    if (!duplicates.has(key)) {
      duplicates.set(key, theme.id);
    } else if (!theme.isActive) {
      deleteIds.push(theme.id);
    }
  }

  if (deleteIds.length) {
    await prisma.theme.deleteMany({ where: { id: { in: deleteIds } } });
  }

  console.log(`Cleaned unnamed: ${unnamed.length}, duplicates removed: ${deleteIds.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
