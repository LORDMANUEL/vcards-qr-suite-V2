/** VCard edits mutate the shared User profile; never silently alter other cards. */
export type EditPolicy = 'ok' | 'denied' | 'archived' | 'shared';
export function canEditCard(input: {
  cardActive: boolean; userActive: boolean; userCards: number;
  admin: boolean; sameBranch: boolean;
}): EditPolicy {
  if (!input.admin && !input.sameBranch) return 'denied';
  if (!input.cardActive || !input.userActive) return 'archived';
  if (input.userCards > 1) return 'shared';
  return 'ok';
}
