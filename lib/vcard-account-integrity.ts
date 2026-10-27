/** Do not silently move existing accounts between branches while creating cards. */
export type ExistingAdvisorAccount = {
  branchId: string | null;
  role: string;
  isSystemUser: boolean;
  isActive: boolean;
  vcards: Array<{ branchId: string | null }>;
};
export type CreationConflict =
  | 'PROTECTED_USER'
  | 'INACTIVE_USER'
  | 'ACCOUNT_OTHER_BRANCH'
  | 'CARD_OTHER_BRANCH'
  | 'CARD_ALREADY_EXISTS';

export function validateAdvisorCardCreation(
  account: ExistingAdvisorAccount | null,
  requestedBranchId: string,
): CreationConflict | null {
  if (!account) return null;
  if (account.role !== 'ADVISOR' || account.isSystemUser) return 'PROTECTED_USER';
  if (!account.isActive) return 'INACTIVE_USER';
  if (account.vcards.some(card => card.branchId === requestedBranchId)) return 'CARD_ALREADY_EXISTS';
  if (account.vcards.some(card => card.branchId !== requestedBranchId)) return 'CARD_OTHER_BRANCH';
  if (account.branchId && account.branchId !== requestedBranchId) return 'ACCOUNT_OTHER_BRANCH';
  return null;
}

export const cardCreationError: Record<CreationConflict, string> = {
  PROTECTED_USER: 'El correo pertenece a una cuenta protegida o de sistema. No se puede modificar para crear una vCard.',
  INACTIVE_USER: 'La cuenta está inactiva. Reactívela mediante el procedimiento administrativo antes de crear tarjetas.',
  ACCOUNT_OTHER_BRANCH: 'La cuenta pertenece a otra sucursal. Utilice el procedimiento de traslado autorizado.',
  CARD_OTHER_BRANCH: 'La cuenta ya tiene una tarjeta en otra sucursal. No se puede cambiar su sede sin revisión.',
  CARD_ALREADY_EXISTS: 'La cuenta ya tiene una vCard en esta sucursal.',
};
