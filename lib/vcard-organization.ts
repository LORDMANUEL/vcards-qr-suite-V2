export const UNASSIGNED_CITY = '__UNASSIGNED_CITY__';

export interface OrganizationBranch {
  id: string;
  name: string;
  city?: string | null;
  companyId?: string | null;
}

function clean(value?: string | null) {
  return String(value || '').trim();
}

function cityKey(value?: string | null) {
  const normalized = clean(value);
  return normalized ? normalized.toLocaleLowerCase('es') : UNASSIGNED_CITY;
}

export function getCitiesForCompany(branches: OrganizationBranch[], companyId: string) {
  const unique = new Map<string, string>();

  branches
    .filter((branch) => branch.companyId === companyId)
    .forEach((branch) => {
      const key = cityKey(branch.city);
      if (!unique.has(key)) unique.set(key, clean(branch.city) || UNASSIGNED_CITY);
    });

  return [...unique.values()].sort((left, right) => {
    if (left === UNASSIGNED_CITY) return 1;
    if (right === UNASSIGNED_CITY) return -1;
    return left.localeCompare(right, 'es', { sensitivity: 'base' });
  });
}

export function getBranchesForSelection(
  branches: OrganizationBranch[],
  companyId: string,
  city: string,
) {
  if (!companyId || !city) return [];
  const expectedCity = city === UNASSIGNED_CITY ? UNASSIGNED_CITY : cityKey(city);

  return branches
    .filter((branch) => branch.companyId === companyId && cityKey(branch.city) === expectedCity)
    .sort((left, right) => left.name.localeCompare(right.name, 'es', { sensitivity: 'base' }));
}

export function getBranchCity(branches: OrganizationBranch[], branchId: string) {
  const branch = branches.find((candidate) => candidate.id === branchId);
  return branch ? clean(branch.city) || UNASSIGNED_CITY : '';
}

export function getAutoSelection(values: string[]) {
  return values.length === 1 ? values[0] : '';
}

export function formatCityLabel(city: string) {
  return city === UNASSIGNED_CITY ? 'Ciudad no definida' : city;
}
