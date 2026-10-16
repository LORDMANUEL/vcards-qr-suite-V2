'use client';

import { useEffect, useMemo } from 'react';
import {
  formatCityLabel,
  getAutoSelection,
  getBranchesForSelection,
  getCitiesForCompany,
  OrganizationBranch,
} from '@/lib/vcard-organization';

interface CompanyOption {
  id: string;
  name: string;
}

interface OrganizationCascadeProps {
  companies: CompanyOption[];
  branches: OrganizationBranch[];
  companyId: string;
  city: string;
  branchId: string;
  disabled?: boolean;
  onChange: (selection: { companyId: string; city: string; branchId: string }) => void;
}

const fieldClass = 'mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#003478] disabled:cursor-not-allowed disabled:bg-gray-100';

export function OrganizationCascade({
  companies,
  branches,
  companyId,
  city,
  branchId,
  disabled = false,
  onChange,
}: OrganizationCascadeProps) {
  const cities = useMemo(() => getCitiesForCompany(branches, companyId), [branches, companyId]);
  const availableBranches = useMemo(
    () => getBranchesForSelection(branches, companyId, city),
    [branches, companyId, city],
  );

  useEffect(() => {
    if (!companyId || city) return;
    const nextCity = getAutoSelection(cities);
    if (nextCity) onChange({ companyId, city: nextCity, branchId: '' });
  }, [cities, city, companyId, onChange]);

  useEffect(() => {
    if (!companyId || !city || branchId) return;
    const nextBranchId = getAutoSelection(availableBranches.map((branch) => branch.id));
    if (nextBranchId) onChange({ companyId, city, branchId: nextBranchId });
  }, [availableBranches, branchId, city, companyId, onChange]);

  return (
    <>
      <label className="block text-sm font-medium text-gray-700">
        Empresa <span className="text-red-500">*</span>
        <select
          name="companyId"
          value={companyId}
          onChange={(event) => onChange({ companyId: event.target.value, city: '', branchId: '' })}
          required
          disabled={disabled}
          className={fieldClass}
        >
          <option value="">Seleccione una empresa</option>
          {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
        </select>
      </label>

      <label className="block text-sm font-medium text-gray-700">
        Ciudad <span className="text-red-500">*</span>
        <select
          name="city"
          value={city}
          onChange={(event) => onChange({ companyId, city: event.target.value, branchId: '' })}
          required
          disabled={disabled || !companyId || cities.length === 0}
          className={fieldClass}
        >
          <option value="">{companyId && cities.length === 0 ? 'Empresa sin ciudades' : 'Seleccione una ciudad'}</option>
          {cities.map((option) => <option key={option} value={option}>{formatCityLabel(option)}</option>)}
        </select>
      </label>

      <label className="block text-sm font-medium text-gray-700 md:col-span-2">
        Sucursal <span className="text-red-500">*</span>
        <select
          name="branchId"
          value={branchId}
          onChange={(event) => onChange({ companyId, city, branchId: event.target.value })}
          required
          disabled={disabled || !city || availableBranches.length === 0}
          className={fieldClass}
        >
          <option value="">{city && availableBranches.length === 0 ? 'Ciudad sin sucursales' : 'Seleccione una sucursal'}</option>
          {availableBranches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
        </select>
      </label>
    </>
  );
}
