import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { prisma } from '../lib/prisma';
import { canDeleteTheme } from '../lib/vcard-theme-deletion';

/**
 * ONLY runs against a disposable PostgreSQL database created by CI.
 * Never run this with production DATABASE_URL or on a shared database.
 */
test('PostgreSQL contract: multi-company branches, vCard transaction and theme FK integrity',
  { skip: process.env.RUN_DB_INTEGRATION !== 'true' },
  async () => {
    // Defense in depth: refuse to write anywhere but GitHub Actions' disposable
    // local vcards_ci database, even if RUN_DB_INTEGRATION was set accidentally.
    const connection = new URL(process.env.DATABASE_URL || '');
    if (process.env.CI !== 'true'
        || connection.hostname !== '127.0.0.1'
        || connection.port !== '5432'
        || connection.pathname !== '/vcards_ci') {
      throw new Error('Bloqueado: estas pruebas requieren PostgreSQL efímero de CI en 127.0.0.1:5432/vcards_ci');
    }
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
      const originalQr = randomUUID();
      const card = await prisma.vCard.create({
        data: { userId, branchId, qrCodeData: originalQr, isActive: true },
      });
      assert.equal(await prisma.vCard.count({ where: { userId, branchId } }), 1);
      const scan = await prisma.scan.create({ data: { vcardId: card.id, scanMethod: 'QR' } });
      // Archived cards keep their original ID, signed QR lookup ID and full scan history.
      await prisma.vCard.updateMany({ where: { id: card.id, isActive: true }, data: { isActive: false } });
      const archived = await prisma.vCard.findUnique({ where: { id: card.id } });
      assert.equal(archived?.isActive, false);
      assert.equal(archived?.qrCodeData, originalQr);
      // The same public server-side predicate is used by V1 and V2:
      // no inactive VCard or inactive User should ever render.
      assert.equal(await prisma.vCard.findFirst({
        where: { qrCodeData: originalQr, isActive: true, user: { isActive: true } },
      }), null);
      assert.equal(await prisma.scan.count({ where: { id: scan.id, vcardId: card.id } }), 1);
      await prisma.vCard.updateMany({ where: { id: card.id, isActive: false }, data: { isActive: true } });
      assert.equal((await prisma.vCard.findUnique({ where: { id: card.id } }))?.isActive, true);
      assert.ok(await prisma.vCard.findFirst({
        where: { qrCodeData: originalQr, isActive: true, user: { isActive: true } },
      }));
      assert.equal(await prisma.scan.count({ where: { vcardId: card.id } }), 1);

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

      // Optional Prisma FK references may have ON DELETE SET NULL.
      // Never rely on the database to reject deletion: our API must enforce 409.
      const theme = await prisma.theme.create({
        data: { name: `CI Tema ${suffix}`, category: 'VCARD', type: 'CORPORATE', isActive: true },
      });
      themeId = theme.id;
      await prisma.company.update({ where: { id: companyId }, data: { defaultVcardThemeId: themeId } });
      const companies = await prisma.company.count({ where: { defaultVcardThemeId: themeId } });
      assert.equal(companies, 1);
      assert.equal(canDeleteTheme({ companies, branches: 0, positionRules: 0, accessPoints: 0 }), false);
      const storedCompany = await prisma.company.findUnique({ where: { id: companyId } });
      assert.equal(storedCompany?.defaultVcardThemeId, themeId);
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
