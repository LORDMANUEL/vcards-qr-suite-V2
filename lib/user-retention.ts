import type { PrismaClient } from '@prisma/client';

export type UserDeletionResult =
  | { status: 'not_found' }
  | { status: 'has_vcards'; vcards: number }
  | { status: 'deleted'; email: string; name: string };

/**
 * Lock the parent User row before examining the VCard count.
 *
 * IMPORTANT: VCard.user has ON DELETE CASCADE. A count check followed by a
 * separate delete can race against the creation of a card and destroy scans.
 * FOR UPDATE serializes child insertions that take a parent-key lock.
 */
export async function deleteUnlinkedUser(
  db: PrismaClient,
  userId: string,
): Promise<UserDeletionResult> {
  return db.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE
    `;
    if (locked.length === 0) return { status: 'not_found' } as const;

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true,
        _count: { select: { vcards: true } },
      },
    });
    if (!user) return { status: 'not_found' } as const;
    if (user._count.vcards > 0) {
      return { status: 'has_vcards', vcards: user._count.vcards } as const;
    }
    await tx.user.delete({ where: { id: userId } });
    return { status: 'deleted', email: user.email, name: user.name } as const;
  }, { isolationLevel: 'Serializable' });
}
