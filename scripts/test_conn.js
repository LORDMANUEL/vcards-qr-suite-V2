const { PrismaClient } = require("@prisma/client");

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const prisma = new PrismaClient();
  try {
    const count = await prisma.branch.count();
    console.log(JSON.stringify({ connected: true, branchCount: count }));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("DATABASE_CONNECTION_TEST_FAILED", error.message);
  process.exit(1);
});

