
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  try {
    const b = await p.branch.count();
    const c = await p.company.count();
    const v = await p.vCard.count();
    const u = await p.user.count();
    const aps = await p.accessPoint.count();
    console.log(JSON.stringify({branches: b, companies: c, vcards: v, users: u, accessPoints: aps}));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await p.$disconnect();
  }
}
run();
