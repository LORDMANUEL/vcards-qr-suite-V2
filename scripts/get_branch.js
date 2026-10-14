
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  const b = await p.branch.findFirst();
  if (b) console.log('BRANCH_ID:' + b.id);
  await p.$disconnect();
}
run();
