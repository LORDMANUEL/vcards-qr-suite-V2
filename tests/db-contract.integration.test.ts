import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { prisma } from '../lib/prisma';

/**
 * ONLY runs against a disposable PostgreSQL database created by CI.
 * Never run this with production DATABASE_URL or on a shared database.
 */
test('PostgreSQL contract: multi-company branches, vCard transaction and theme FK integrity',
  { skip: process.env.RUN_DB_INTEGRATION !== 'true' },
  async () => {
    const suffix = randomUUID().slice(0, 10);
    let companyId: string | undefined;
    let branchId: string | undefined;
    let userId: string | undefined;
    let themeId: string | undefined;

    try {
      const company = await prisma.company.create({
        data: { name: `CI VCards ${suffix}`, slug: `ci-${suffix}` },
      });
      companyId = company.id;

      // A new company does not implicitly create a branch at Prisma level.
      assert.equal(await prisma.branch.count({ where: { companyId } }), 0);

      const branch = await prisma.branch.create({
        data: { companyId, companyName: company.name, name: 'CI SPS', city: 'San Pedro Sula', uniqueSlug: `ci-sps-${suffix}` },
      });
      branchId = branch.id;
      assert.equal(await prisma.branch.count({ where: { companyId } }), 1);

      const user = await prisma.user.create({
        data: {
          name: 'Contacto CI', email: `contact-${suffix}@example.invalid`,
          password: 'not-a-real-password', role: 'ADVISOR', isSystemUser: false,
          branchId, isActive: true,
        },
      });
      userId = user.id;
      await prisma.vCard.create({
        data: { userId, branchId, qrCodeData: randomUUID(), isActive: true },
      });
      assert.equal(await prisma.vCard.count({ where: { userId, branchId } }), 1);

      // An intentional error inside a transaction must roll back changes to both
      // account and vCard. This simulates a failed second card creation.
      await assert.rejects(
        prisma.$transaction(async (tx) => {
          await tx.user.update({ where: { id: userId }, data: { name: 'SHOULD ROLLBACK' } });
          await tx.vCard.create({ data: { userId: userId!, branchId, qrCodeData: randomUUID() } });
          throw new Error('intentional rollback');
        }, { isolationLevel: 'Serializable' }),
        /intentional rollback/,
      );
      const after = await prisma.user.findUnique({ where: { id: userId } });
      assert.equal(after?.name, 'Contacto CI');
      assert.equal(await prisma.vCard.count({ where: { userId } }), 1);

      // A theme referenced by Company must survive delete attempts (FK safety).
      const theme = await prisma.theme.create({
        data: { name: `CI Tema ${suffix}`, category: 'VCARD', type: 'CORPORATE', isActive: true },
      });
      themeId = theme.id;
      await prisma.company.update({ where: { id: companyId }, data: { defaultVcardThemeId: themeId } });
      await assert.rejects(prisma.theme.delete({ where: { id: themeId } }));
      assert.ok(await prisma.theme.findUnique({ where: { id: themeId } }));
    } finally {
      // Disposable fixtures only. CI database is isolated and short-lived.
      if (userId) await prisma.vCard.deleteMany({ where: { userId } });
      if (userId) await prisma.user.deleteMany({ where: { id: userId } });
      if (companyId) await prisma.company.update({ where: { id: companyId }, data: { defaultVcardThemeId: null } }).catch(() => {});
      if (branchId) await prisma.branch.deleteMany({ where: { id: branchId } });
      if (companyId) await prisma.company.deleteMany({ where: { id: companyId } });
      if (themeId) await prisma.theme.deleteMany({ where: { id: themeId } });
      await prisma.$disconnect();
    }
  },
);
