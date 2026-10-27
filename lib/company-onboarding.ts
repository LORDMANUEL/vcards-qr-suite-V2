/** Only explicitly provided branch drafts may create a branch.
 * Company creation by itself must never synthesize a branch from company name.
 */
export interface BranchDraft {
  name?: string | null;
  city?: string | null;
  address?: string | null;
  country?: string | null;
  uniqueSlug?: string | null;
}
export interface NormalizedBranchDraft {
  name: string;
  city: string;
  address: string | null;
  country: string;
  uniqueSlug: string;
}
const slugify = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function explicitCompanyBranches(input: unknown, companyName: string): NormalizedBranchDraft[] {
  if (!Array.isArray(input)) return [];
  const normalized: NormalizedBranchDraft[] = [];
  const seen = new Set<string>();
  for (const draft of input as BranchDraft[]) {
    const city = typeof draft?.city === 'string' ? draft.city.trim() : '';
    if (!city) continue;
    const name = typeof draft?.name === 'string' && draft.name.trim()
      ? draft.name.trim() : `${companyName} - ${city}`;
    const uniqueSlug = typeof draft?.uniqueSlug === 'string' && draft.uniqueSlug.trim()
      ? draft.uniqueSlug.trim() : slugify(`${companyName}-${city}`);
    if (!uniqueSlug || seen.has(uniqueSlug)) throw new Error('Sucursales repetidas o identificadores inválidos');
    seen.add(uniqueSlug);
    normalized.push({
      name,
      city,
      address: typeof draft?.address === 'string' ? draft.address.trim() || null : null,
      country: typeof draft?.country === 'string' && draft.country.trim() ? draft.country.trim() : 'Honduras',
      uniqueSlug,
    });
  }
  return normalized;
}
